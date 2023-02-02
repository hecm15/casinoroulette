from http.client import OK
import os 
import sys
import random
from datetime import datetime

from flask import Flask, jsonify, render_template, redirect, flash, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
import mysql.connector
from mysql.connector import errorcode
from functools import wraps
import json
from datetime import datetime

#Configure application
app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
 
#Template auto reloading
app.config["TEMPLATES_AUTO_RELOAD"] = True  

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


# Establishing SQL Connection
try: 
    roulette_db = mysql.connector.connect(user='root', password='Hm061500!' ,
                                    host='127.0.0.1', database="roulettedb")
    if roulette_db.is_connected():
        db_Info = roulette_db.get_server_info()
        print("Connected to MySQL Server version ", db_Info)
except mysql.connector.Error as error:
    if error.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Connection to database could not be established due to incorrect Log In information. ")
        sys.exit(1)
    elif error.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
        sys.exit(2)
    else:
        print(error)
        sys.exit(3)


#Ensuring Server Shutdown once Flask is quit 
def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@app.route('/shutdown', methods=['POST'])
def shutdown():
    shutdown_server()
    return 'Server shutting down...'


#Login_required function to check for session id for user access only pages
def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/1.1.x/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


# default path to game board, require login 
@app.route('/')
@login_required
def welcome():
    return render_template("game.html")

#descriptions of transaction types GLOBAL VARIABLE
descriptions = {
            0: "Spin",
            1: "Deposit",
            2: "Withdraw"
        }

# path to bank deposit and withdrawls
@app.route('/bank', methods=['GET', 'POST'])
@login_required
def bank():

    # after that is up and running, implement amount after deposit/withdraw asynchrousnously as people type an amount, if withdrawl amount exceeds bank value, lock the form 
    if request.method == "POST":

        #setting current user globally for the function
        currentuser = session["user_id"]
        date = datetime.now()
        today =  date.strftime("%Y-%m-%d %H:%M:%S") 


        #if the selected transaction type is deposit , extract deposit amount, query the database and update with the sum of deposit amount and current bank amount
        if request.form.get("transaction") == "Deposit":
            try:
                deposit = int(request.form.get("amount"))
                
                #setting cursors for SELECT and UPDATE statements
                roulette1 = roulette_db.cursor()
                roulette2 = roulette_db.cursor()
                roulette3 = roulette_db.cursor()
                roulette4 = roulette_db.cursor()
                data = (currentuser,)

                roulette1.execute("SELECT bank FROM users WHERE id = %s", (data))
                result = roulette1.fetchall()
                
                curbank = int(result[0][0])
                newbank = deposit + curbank
                data = (newbank, currentuser)

                
                roulette2.execute("UPDATE users SET bank = %s WHERE id = %s", (data))


                roulette3.execute("SELECT balance_after FROM transactions WHERE user_id = %s ORDER BY transaction_id DESC LIMIT 1", (currentuser,))
                prev_transc_result = roulette3.fetchall()

                type = 1
               
                if prev_transc_result:
                    prev_transc = int(prev_transc_result[0][0])

                    if curbank == prev_transc:
                           
                        #if a previous transaction exists, use that balance_after value for the math here, else, use the bank value from banks
                        bal_before = prev_transc
                        bal_after = bal_before + deposit
                        try:
                            roulette4.execute("INSERT INTO transactions (date, type, description, amount, balance_before, balance_after, spin_id, user_id, winnings) VALUES (%s,%s,%s,%s,%s,%s,%s,%s, %s)", (today, type, descriptions[type], deposit, bal_before, bal_after, None, currentuser,0))
                        except Exception as e:
                            print(e) 
                        
                        roulette_db.commit()
                        return render_template("bank.html", currentval=newbank)
                    else:
                        flash("Not able to process transaction please contact administration.")
                        return render_template("bank.html")
                else:
                    try:
                        roulette4.execute("INSERT INTO transactions (date, type, description, amount, balance_before, balance_after, spin_id, user_id, winnings) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", (today, type, descriptions[type], deposit, curbank, newbank, None, currentuser,0))
                        roulette_db.commit()
                        return render_template("bank.html", currentval=newbank)
                    except Exception as e:
                        print(e)

            except Exception as e:
                print(e)
            finally:
                roulette1.close()
                roulette2.close()
                roulette3.close()
                roulette4.close()

        # if the selected transaction type is withdraw , extract withdrawl amount and update bank with the difference of current bank and withdrawl amount
        elif request.form.get("transaction") == "Withdraw": 
            try:
                withdraw = int(request.form.get("amount"))

                #Setting cursors for SELECT and UPDATE statements
                roulette1 = roulette_db.cursor()
                roulette2 = roulette_db.cursor()
                roulette3 = roulette_db.cursor()
                roulette4 = roulette_db.cursor()
                data = (currentuser,)

                roulette1.execute("SELECT bank FROM users WHERE id = %s", (data))
                result = roulette1.fetchall()
            
                curbank = int(result[0][0])
                #form shouldn't allow submission if withdrawl is more than cur bank amount but for safety we check here as well 
                if withdraw < curbank: 
                    newbank = curbank - withdraw
                    data = (newbank , currentuser)
                    
                    roulette2.execute("UPDATE users SET bank = %s WHERE id = %s", (data))

                    roulette3.execute("SELECT balance_after FROM transactions WHERE user_id = %s ORDER BY transaction_id DESC LIMIT 1", (currentuser,))
                    prev_transc_result = roulette3.fetchall()

                    type = 2
               
                    if prev_transc_result:
                        prev_transc = int(prev_transc_result[0][0])

                        if curbank == prev_transc:
                            
                            #if a previous transaction exists, use that balance_after value for the math here, else, use the bank value from banks
                            bal_before = prev_transc
                            bal_after = bal_before - withdraw
                            try:
                                roulette4.execute("INSERT INTO transactions (date, type, description, amount, balance_before, balance_after, spin_id, user_id, winnings) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", (today, type, descriptions[type], withdraw, bal_before, bal_after, None, currentuser, 0))
                            except Exception as e:
                                print(e) 
                            
                            roulette_db.commit()
                            return render_template("bank.html", currentval=newbank)
                        else:
                            flash("Not able to process transaction please contact administration.")
                            return render_template("bank.html")
                    else:
                        try:
                            roulette4.execute("INSERT INTO transactions (date, type, description, amount, balance_before, balance_after, spin_id, user_id, winnings) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", (today, type, descriptions[type], withdraw, curbank, newbank, None, currentuser, 0))
                            roulette_db.commit()
                            return render_template("bank.html", currentval=newbank)
                        except Exception as e:
                            print(e)
                    
        
                else:
                    print("Not enough funds to satisfy this withdrawl." )
                    return render_template("bank.html")
                
            except Exception as e:
                print(e)
            finally:
                roulette1.close()
                roulette2.close()
                roulette3.close()
                roulette4.close()
    # for GET request 
    else:
        try:
            currentuser = (session["user_id"],)
            roulette = roulette_db.cursor()
            roulette.execute("SELECT bank FROM users WHERE id = %s", (currentuser))
            result = roulette.fetchall()
            currentval = result[0][0]
            return render_template('bank.html', currentval=currentval)
        except Exception as e:
            print(e)
        finally:
            roulette.close()


#login route
@app.route('/login', methods= ['GET', 'POST'])
def login():
    
    #forget any user id
    session.clear()

    # Since form can only be submitted once text fields filled, no check needed for empty username and password
    if request.method == 'POST':
        try:
            username = (request.form.get("username").lower(),)
            password = request.form.get("password")

            roulette = roulette_db.cursor()
            roulette.execute("SELECT id, username, pw_hash FROM users WHERE username = %s", (username))
            result = roulette.fetchall() 

            # if username found in database, check password validity
            if result:
                if check_password_hash(result[0][2], password):
                    session["user_id"] = result[0][0]
                    return redirect('/')
                else:
                    flash("Invalid username or password, please try again.")
                    return render_template("login.html")
            else:
                flash("Invalid username or password, please try again.")
                return render_template("login.html")
        except Exception as e:
            print(e)
        finally: 
            roulette.close()
    else:
        return render_template("login.html")

#Logout
@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')


#register route
@app.route('/register', methods=['GET', 'POST'])
def register():
    
    if request.method == 'POST':
        # given ajax and jquery limitations on form submitting UNLESS username available and passwords match, If a form is posted to /register, all checks have been passed and all that needs to be done is a commit of new user data to the database
        #IMPLEMENT SAFETY CHECK
        try:
            username = request.form.get("username").lower()
            password = request.form.get("password")
            hash = generate_password_hash(password, method='pbkdf2:sha1', salt_length=8)
            roulette = roulette_db.cursor()
            roulette.execute("INSERT INTO users (username, pw_hash) VALUES(%s, %s)", (username, hash))
            roulette_db.commit()
            roulette.close()
            return render_template("login.html")
        except TypeError as e:
            print(e)
            return redirect ("/register")
    else:
        return render_template("register.html")



# Username avaiability check, Ajax posts the username to this route asynchronously.  
@app.route('/user_check', methods=['POST'])
def username_check():
	try:
		username = (request.form['username'],)
		
		# validate the received values once ajax post to this app route and username isn't empty
		if username and request.method == 'POST':		
			roulette = roulette_db.cursor()
			roulette.execute("SELECT username FROM users WHERE username = %s", username)
			result = roulette.fetchall()
			
            #if db query returns results, send response as unavailable
			if result:
				resp = jsonify('<span style=\'color:red;\'>Username unavailable</span>')
				resp.status_code = 200
				return resp
            #if db query does not return results, send response as available
			else:
				resp = jsonify('<span style=\'color:green;\'>Username available</span>')
				resp.status_code = 200
				return resp
		else:
			resp = jsonify('<span style=\'color:red;\'>Username is required field.</span>')
			resp.status_code = 200
			return resp
	except Exception as e:
		print(e)
	finally:
		roulette.close() 



# Check password match once ajax post to this route and return message for matching and not matching
@app.route('/password_check', methods=['POST'])
def password_check():
    try: 
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        if not password == confirmation: 
            resp = jsonify('<span style=\'color:red;\'>Passwords do not match</span>')
            resp.status_code = 200
            return resp
        else:
            resp = jsonify('<span style=\'color:green;\'>Passwords are a match.</span>')
            resp.status_code = 200
            return resp
    except Exception as e:
        print(e)



# Check if withdrawl attempt is larger than bank funds available, ajax asynchrously posts to this route and returns message for user
@app.route('/bank_check', methods=['POST'])
def bank_check():

    currentuser = (session["user_id"],)
    transaction = request.form.get("transaction")

    try:
        roulette = roulette_db.cursor()
        roulette.execute("SELECT bank FROM users WHERE id = %s", currentuser)
        result = roulette.fetchall()

        currentbank = int(result[0][0])
        transc_amt = int(request.form.get("amount"))

        if transaction == "Withdraw":

            if not transc_amt < currentbank:
                resp = jsonify('<span style=\'color:red;\'>You do not have the funds to satisfy this withdrawl.</span>')
                resp.status_code = 200
                return resp
            else:
                #work on returning the amount after transaction here and in jquery differentiate where to include these messages depending on what is return so that you can implement both check and amount after withdrawl with one route
                newbank = currentbank - transc_amt
                msg = "Bank Balance after transaction: {}".format(newbank)
                resp = jsonify('<span style=\'color:green;\'>{}</span>'.format(msg))
                resp.status_code = 200
                return resp 
        else:
            newbank = currentbank + transc_amt
            msg = "Bank Balance after transaction: {}".format(newbank)
            resp = jsonify('<span style=\'color:green;\'>{}</span>'.format(msg))
            resp.status_code = 200
            return resp 
    except Exception as e:
        pass
    finally:
        roulette.close()

# fetch url for bank value passing 
@app.route('/bank_fetch', methods=['POST'])
def bank_fetch():

    try:
        if request.method == 'POST':

            currentuser = (session["user_id"],)

            roulette = roulette_db.cursor()
            roulette.execute("SELECT bank FROM users WHERE id = %s", (currentuser))
            result = roulette.fetchall()

            if result: 
                try: 
                    resp = jsonify(result[0][0])
                    resp.status_code = 200
                    return resp
                except Exception as e:
                    print(e)

    except Exception as e: 
        print(e)
    finally:
        roulette.close()

@app.route('/bank_update', methods=['POST'])
def bank_update():
    if request.method == 'POST':
        try:
            currentuser = session['user_id']
            output = request.get_json(force=True)
            
            roulette = roulette_db.cursor()
            roulette.execute("UPDATE users SET bank = %s WHERE id = %s", (output, currentuser))
            roulette_db.commit()
            roulette.close()
            resp = jsonify("Success")
            resp.status_code = 200
            return resp
        except Exception as e:
            print(e)
            resp = jsonify("ERROR")
            resp.status_code = 400
            return resp
            

@app.route('/random_num', methods=['POST'])
def random_num():

    try: 
        if request.method == 'POST':
            num = random.randint(0,36)
            
            number = jsonify(num)
            number.status_code = 200

            return number 
    except Exception as e: 
        print(e)
            

winningspin = 0

@app.route("/spin_table", methods=['POST'])
def spin_table():

    currentuser = session["user_id"]
    global winningspin
    winningspin = int(request.get_json(force=True))
    date = datetime.now()
    today =  date.strftime("%Y-%m-%d %H:%M:%S")


    try:

        roulette = roulette_db.cursor()
        roulette.execute("INSERT INTO spins (date_of_spin, winning_number, user_id) VALUES (%s, %s, %s)" , (today, winningspin, currentuser))

        roulette_db.commit()

        resp = jsonify("Success")
        resp.status_code = 200
        return resp

    except Exception as e: 
        print(e)
    finally:
        roulette.close()
   

            
@app.route('/bet_table', methods=['POST'])
def bet_table():

        currentuser = session["user_id"]
        type = 0 
        date = datetime.now()
        today =  date.strftime("%Y-%m-%d %H:%M:%S")
        betstotal = 0
        earnings = 0

        try:
            roulette = roulette_db.cursor()
            roulette.execute("SELECT spin_id FROM spins ORDER BY spin_id DESC LIMIT 1")
            result = roulette.fetchall()
            spin_id = int(result[0][0])
        
        except Exception as e:
            print(e)
        finally:
            roulette.close()

        try: 
             
             output = request.get_json(force=True)
             winnings = 0

             for bet in output['bets']:
                try:
                    roulette = roulette_db.cursor()
                except Exception as e:
                        print(e)

                if not bet['type'] == "removed":
                    betnums = bet['numbers'].split(", ")
                    intnums = list(map(int, betnums))
                    betstotal = betstotal + int(bet['amt'])
                    
                
                    if  winningspin in intnums:
                        win = "Win"
                        amountwon = bet["odds"] * bet['amt']
                        winnings += amountwon + bet['amt']
                        roulette.execute("INSERT INTO bets(wager, type_of_bet, numbers_bet, win_or_loss, amount_won, spin_id, user_id) VALUES( %s, %s, %s, %s, %s, %s, %s)", (str(bet['amt']), bet['type'], bet['numbers'], win, amountwon, spin_id, currentuser))
                        roulette_db.commit()
                    else:
                        loss = "Loss"
                        amountwon = 0
                        winnings += amountwon
                        roulette.execute("INSERT INTO bets(wager, type_of_bet, numbers_bet, win_or_loss, amount_won, spin_id, user_id) VALUES( %s, %s, %s, %s, %s, %s, %s)", (str(bet['amt']), bet['type'], bet['numbers'], loss, amountwon, spin_id, currentuser))
                        roulette_db.commit()
                else: 
                    pass
                    
        except Exception as e:
            print(e)
            resp = jsonify("Failure")
            resp.status_code = 400
            return resp
        finally:
            roulette.close()

        try:

            roulette1 = roulette_db.cursor()
            roulette1.execute("SELECT bank FROM users WHERE id = %s", (currentuser,))
            result = roulette1.fetchall()
            
            curbank = int(result[0][0])

            roulette2 = roulette_db.cursor()
            roulette2.execute("SELECT balance_after FROM transactions WHERE user_id = %s ORDER BY transaction_id DESC LIMIT 1", (currentuser,))
            prev_transc_result = roulette2.fetchall()

            roulette3 = roulette_db.cursor()

        
            if prev_transc_result:
                prev_transc = int(prev_transc_result[0][0])

                if curbank == prev_transc:
                    
                    #if a previous transaction exists, use that balance_after value for the math here, else, use the bank value from banks
                    bal_before = prev_transc
                    bal_after = output['bankval']
                    try:
                        roulette3.execute("INSERT INTO transactions (date, type, description, amount, balance_before, balance_after, spin_id, user_id, winnings) VALUES (%s,%s,%s,%s,%s,%s,%s,%s, %s)", (today, type, (descriptions[type] + '-' + str(spin_id)), betstotal, bal_before, bal_after, spin_id, currentuser, winnings))
                    except Exception as e:
                        print(e) 
                    
                    roulette_db.commit()
                else:
                    flash("Not able to process transaction please contact administration.")
                    return render_template('/')
            else:
                try:
                    bal_after = output['bankval']
                    roulette3.execute("INSERT INTO transactions (date, type, description, amount, balance_before, balance_after, spin_id, user_id, winnings) VALUES (%s,%s,%s,%s,%s,%s,%s,%s, %s)", (today, type, (descriptions[type] + '-' + str(spin_id)), betstotal, curbank, bal_after, spin_id, currentuser, winnings))
                    roulette_db.commit()
                except Exception as e:
                    print(e)

            resp = jsonify("Success")
            resp.status_code = 200
            return resp
        except Exception as e:
            print(e)
            resp = jsonify("Failure")
            resp.status_code = 400
            return resp
        finally:
            roulette1.close()
            roulette2.close()
            roulette3.close()

@app.route('/spinreports', methods=['GET', 'POST'])
def spin_reports():

    currentuser = session['user_id']

    roulette = roulette_db.cursor()

    roulette.execute("SELECT spin_id, date_of_spin, winning_number FROM spins WHERE user_id = %s", (currentuser,))

    results = roulette.fetchall()
    report_list = []

    for result in results:
        report_list.append(list(result))

    return render_template('spinreports.html', reports=report_list)

@app.route('/betreports', methods=['GET', 'POST'])
def bet_reports():

    currentuser = session['user_id']

    roulette = roulette_db.cursor()

    roulette.execute("SELECT spin_id, type_of_bet, numbers_bet, wager, win_or_loss, amount_won FROM bets WHERE user_id = %s", (currentuser,))

    results = roulette.fetchall()
    report_list = []

    for result in results:
        report_list.append(list(result))

    return render_template('betreports.html', reports=report_list)

@app.route('/transactionreports', methods=['GET', 'POST'])
def transactions_reports():

    currentuser = session['user_id']

    roulette = roulette_db.cursor()

    roulette.execute("SELECT date, Description, balance_before, amount, winnings, balance_after FROM transactions WHERE user_id = %s", (currentuser,))

    results = roulette.fetchall()
    report_list = []

    for result in results:
        report_list.append(list(result))

    return render_template('transactionsreport.html', reports=report_list)


