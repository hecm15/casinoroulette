var bankValue = 0

// must be a synchronous ajax post since various tasks within the file depend on the assignment of the bankValue variable 
$.ajax({
	type: "POST",
	url: "/bank_fetch",
	dataType: "json",
	cache: false,
	async: false,
	success: function(msg) {
		 bankValue = msg;
	},
	error: function(jqXHR, textStatus, errorThrown) {
		console.log(textStatus + " " + errorThrown);
	}
});


let currentBet = 0;
let wager = 5;
let lastWager = 0;
let bet = [];
let numbersBet = [];
let previousNumbers = [];
let winStatus;

// Setting an array of numbers for red, black will be "else"
let numRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
// array of all the numbers in the wheel going counter clockwise 
let wheelnumbersAC = [0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];

// creating a new container div with the id 'containter' and appending it to the document
let container = document.createElement('div');
container.setAttribute('id', 'container');
document.body.append(container);

// start game func builds the betting board and wheel via the 
startGame();

// get Element by Class name returns an array with all objects containing this class name 
let wheel = document.getElementsByClassName('wheel')[0];
let ballTrack = document.getElementsByClassName('ballTrack')[0];

// Reset game funciton resets the inital values of the game, removes the current betting board and win or loss notification, it then rebuilds the board via the buildBettingBoard func
function resetGame(){
	$.ajax({
		type: "POST",
		url: "/bank_fetch",
		dataType: "json",
		cache: false,
		async: false,
		success: function(msg) {
			 bankValue = msg;
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus + " " + errorThrown);
		}
	});
	currentBet = 0;
	wager = 5;
	bet = [];
	numbersBet = [];
	previousNumbers = [];
	document.getElementById('betting_board').remove();
	document.getElementById('notification').remove();
	buildBettingBoard();
}

function startGame(){
	buildWheel();
	buildBettingBoard();
}

// gameOver creates and appends a new notification div to the document where the inner message is displayed as bankrupt within a span. The func also creates a new button labeled play again that ON CLICK , calls the reset game func
function gameOver(){
	let notification = document.createElement('div');
	notification.setAttribute('id', 'notification');
		let nSpan = document.createElement('span');
		nSpan.setAttribute('class', 'nSpan');
		nSpan.innerText = 'Bankrupt';
		notification.append(nSpan);

		let nBtn = document.createElement('div');
		nBtn.setAttribute('class', 'nBtn');
		nBtn.innerText = 'Play again';	
		nBtn.onclick = function(){
			resetGame();
		};
		notification.append(nBtn);
	container.prepend(notification);
}

// the build wheel function creates divs for the building of the spinning wheel of numbers. Wheel is the parent div where everything is appeneded to. Sect span classes are sorted by single or double.
function buildWheel(){
	let wheel = document.createElement('div');
	wheel.setAttribute('class', 'wheel');

	let outerRim = document.createElement('div');
	outerRim.setAttribute('class', 'outerRim');
	wheel.append(outerRim);

	let numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
	for(i = 0; i < numbers.length; i++){
		let a = i + 1;
		let spanClass = (numbers[i] < 10)? 'single' : 'double';
		let sect = document.createElement('div');
		sect.setAttribute('id', 'sect'+a);
		sect.setAttribute('class', 'sect');
		let span = document.createElement('span');
		span.setAttribute('class', spanClass);
		span.innerText = numbers[i];
		sect.append(span);
		let block = document.createElement('div');
		block.setAttribute('class', 'block');
		sect.append(block);
		wheel.append(sect);
	}

	let pocketsRim = document.createElement('div');
	pocketsRim.setAttribute('class', 'pocketsRim');
	wheel.append(pocketsRim);

	let ballTrack = document.createElement('div');
	ballTrack.setAttribute('class', 'ballTrack');
	let ball = document.createElement('div');
	ball.setAttribute('class', 'ball');
	ballTrack.append(ball);
	wheel.append(ballTrack);

	let pockets = document.createElement('div');
	pockets.setAttribute('class', 'pockets');
	wheel.append(pockets);

	let cone = document.createElement('div');
	cone.setAttribute('class', 'cone');
	wheel.append(cone);

	let turret = document.createElement('div');
	turret.setAttribute('class', 'turret');
	wheel.append(turret);

	let turretHandle = document.createElement('div');
	turretHandle.setAttribute('class', 'turretHandle');
	let thendOne = document.createElement('div');
	thendOne.setAttribute('class', 'thendOne');
	turretHandle.append(thendOne);
	let thendTwo = document.createElement('div');
	thendTwo.setAttribute('class', 'thendTwo');
	turretHandle.append(thendTwo);
	wheel.append(turretHandle);

	container.append(wheel);
}

// this func is builds the betting board by bet locations and types of bets at the location via onclick and oncontextmenu events 
function buildBettingBoard(){
	let bettingBoard = document.createElement('div');
	bettingBoard.setAttribute('id', 'betting_board');

	let wl = document.createElement('div');
	wl.setAttribute('class', 'winning_lines');
	
	// wlttb_top is coded for here handling the double row bets on the top line of the board
	var wlttb = document.createElement('div');
	wlttb.setAttribute('id', 'wlttb_top');
	wlttb.setAttribute('class', 'wlttb');
	for(i = 0; i < 11; i++){
		let j = i;
		var ttbbetblock = document.createElement('div');
		ttbbetblock.setAttribute('class', 'ttbbetblock');
		var numA = (1 + (3 * j));
		var numB = (2 + (3 * j));
		var numC = (3 + (3 * j));
		var numD = (4 + (3 * j));
		var numE = (5 + (3 * j));
		var numF = (6 + (3 * j));
		let num = numA + ', ' + numB + ', ' + numC + ', ' + numD + ', ' + numE + ', ' + numF;
		
		ttbbetblock.onclick = function(){
			var objType = 'Double Street Bet';
			setBet(this, num, objType, 5);
		};
		ttbbetblock.oncontextmenu = function(e){
			var objType = 'Double Street Bet';
			e.preventDefault();
			removeBet(this, num, objType, 5);
		};
		wlttb.append(ttbbetblock);
	}
	wl.append(wlttb);

	// wlttb 1- 3 is coded for here handling split bets on horizontal lines within the board, and street bets for one row on the bottom line of the board
	for(c =  1; c < 4; c++){
		let d = c;
		var wlttb = document.createElement('div');
		wlttb.setAttribute('id', 'wlttb_'+c);
		wlttb.setAttribute('class', 'wlttb');
		for(i = 0; i < 12; i++){
			let j = i;
			var ttbbetblock = document.createElement('div');
			ttbbetblock.setAttribute('class', 'ttbbetblock');
			ttbbetblock.onclick = function(){
				if(d == 1 || d == 2){
					var numA = ((2 - (d - 1)) + (3 * j));
					var numB = ((3 - (d - 1)) + (3 * j));
					var num = numA + ', ' + numB;
				}
				else{
					var numA = (1 + (3 * j));
					var numB = (2 + (3 * j));
					var numC = (3 + (3 * j));
					var num = numA + ', ' + numB + ', ' + numC;
				}
				var objType = (d == 3)? 'Street Bet' : 'Split Bet';
				var odd = (d == 3)? 11 : 17;
				setBet(this, num, objType, odd);
			};
			ttbbetblock.oncontextmenu = function(e){
				e.preventDefault();
				if(d == 1 || d == 2){
					var numA = ((2 - (d - 1)) + (3 * j));
					var numB = ((3 - (d - 1)) + (3 * j));
					var num = numA + ', ' + numB;
				}
				else{
					var numA = (1 + (3 * j));
					var numB = (2 + (3 * j));
					var numC = (3 + (3 * j));
					var num = numA + ', ' + numB + ', ' + numC;
				}
				var objType = (d == 3)? 'Street Bet' : 'Split Bet';
				var odd = (d == 3)? 11 : 17;
				removeBet(this, num, objType, odd);
			};
			wlttb.append(ttbbetblock);
		}
		wl.append(wlttb);
	}

	// wlrtl 1-11 is coded for here handling split bets on the vertical lines that split number rows across the board 
	for(c = 1; c < 12; c++){
		let d = c;
		var wlrtl = document.createElement('div');
		wlrtl.setAttribute('id', 'wlrtl_'+c);
		wlrtl.setAttribute('class', 'wlrtl');
		for(i = 1; i < 4; i++){
			let j = i;
			var rtlbb = document.createElement('div');
			rtlbb.setAttribute('class', 'rtlbb'+i);
			var numA = (3 + (3 * (d - 1))) - (j - 1);
			var numB = (6 + (3 * (d - 1))) - (j - 1);
			let num = numA + ', ' + numB;

			rtlbb.onclick = function(){
				var objType = 'Split';
				setBet(this, num, objType, 17);
			};
			rtlbb.oncontextmenu = function(e){
				var objType = 'Split';
				e.preventDefault();
				removeBet(this, num, objType, 17);
			};
			wlrtl.append(rtlbb);
		}
		wl.append(wlrtl);
	}
	
	//wlcb 1-2 is coded for here handling all possible corner bets on the inner horizonatal lines of the board
	for(c = 1; c < 3; c++){
		var wlcb = document.createElement('div');
		wlcb.setAttribute('id', 'wlcb_'+c);
		wlcb.setAttribute('class', 'wlcb');
		for(i = 1; i < 12; i++){
			let count = (c == 1)? i : i + 11;
			var cbbb = document.createElement('div');
			cbbb.setAttribute('id', 'cbbb_'+count);
			cbbb.setAttribute('class', 'cbbb');
			var numA = '2';
			var numB = '3';
			var numC = '5';
			var numD = '6';
			let num = (count >= 1 && count < 12)? (parseInt(numA) + ((count - 1) * 3)) + ', ' + (parseInt(numB)+((count - 1) * 3)) + ', ' + (parseInt(numC)+((count - 1) * 3)) + ', ' + (parseInt(numD)+((count - 1) * 3)) : ((parseInt(numA) - 1) + ((count - 12) * 3)) + ', ' + ((parseInt(numB) - 1)+((count - 12) * 3)) + ', ' + ((parseInt(numC) - 1)+((count - 12) * 3)) + ', ' + ((parseInt(numD) - 1)+((count - 12) * 3));
			
			cbbb.onclick = function(){
				var objType = 'Corner Bet';
				setBet(this, num, objType, 8);
			};
			cbbb.oncontextmenu = function(e){
				var objType = 'Corner Bet';
				e.preventDefault();
				removeBet(this, num, objType, 8);
			};
			wlcb.append(cbbb);
		}
		wl.append(wlcb);
	}

	bettingBoard.append(wl);

	// bbtop is created here for the betting of options 1-18 or 19-36 (outside_low and outside_high)
	let bbtop = document.createElement('div');
	bbtop.setAttribute('class', 'bbtop');
	let bbtopBlocks = ['1 to 18', '19 to 36'];
	for(i = 0; i < bbtopBlocks.length; i++){
		let f = i;
		var bbtoptwo = document.createElement('div');
		bbtoptwo.setAttribute('class', 'bbtoptwo');
		let num = (f == 0)? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18' : '19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36';

		bbtoptwo.onclick = function(){
			var objType = (f == 0)? 'First Eighteen' : 'Last Eighteen';
			setBet(this, num, objType, 1);
			
		};
		bbtoptwo.oncontextmenu = function(e){
			var objType = (f == 0)? 'First Eighteen' : 'Last Eighteen';
			e.preventDefault();
			removeBet(this, num, objType, 1);
			
		};
		bbtoptwo.innerText = bbtopBlocks[i];
		bbtop.append(bbtoptwo);
	}
	bettingBoard.append(bbtop);

	// the numberBoard is created here by building number blocks that contain the correspondent # and correspondent color class
	let numberBoard = document.createElement('div');
	numberBoard.setAttribute('class', 'number_board');
	
	// in the case of a zero bet or removal, the odds are automatically set to 35 and its objtype for the bet function is classified as 0
	let zero = document.createElement('div');
	zero.setAttribute('class', 'number_0');
	
	var odds = 35;
	zero.onclick = function(){
		var objType = 'Zero';
		setBet(this, '0', objType, odds);
	};
	zero.oncontextmenu = function(e){
		var objType = 'Zero';
		e.preventDefault();
		removeBet(this, '0', objType, odds);
	};
	let nbnz = document.createElement('div');
	nbnz.setAttribute('class', 'nbn');
	nbnz.innerText = '0';
	zero.append(nbnz);
	numberBoard.append(zero);
	
	// each row of number blocks is created here through a for loop with the '2 to 1' option being integrated within the numberblocks array. The set bet function is adjusted based on the number block clicked or '2 to 1' block clicked.
	var numberBlocks = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, '2 to 1', 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, '2 to 1', 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, '2 to 1'];
	var redBlocks = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
	for(i = 0; i < numberBlocks.length; i++){
		let a = i;
		var nbClass = (numberBlocks[i] == '2 to 1')? 'tt1_block' : 'number_block';
		var colourClass = (redBlocks.includes(numberBlocks[i]))? ' redNum' : ((nbClass == 'number_block')? ' blackNum' : '');
		var numberBlock = document.createElement('div');
		numberBlock.setAttribute('class', nbClass + colourClass);
		numberBlock.onclick = function(){
			if(numberBlocks[a] != '2 to 1'){
				var objType = 'Straight Bet';
				setBet(this, ''+numberBlocks[a]+'', objType, 35);
			}else{
				num = (a == 12)? '3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36' : ((a == 25)? '2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35' : '1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34');
				var objType = "Columns";
				setBet(this, num, objType, 2);
			}
		};
		numberBlock.oncontextmenu = function(e){
			e.preventDefault();
			if(numberBlocks[a] != '2 to 1'){
				var objType = 'Straight Bet';
				removeBet(this, ''+numberBlocks[a]+'', objType, 35);
			}else{
				var objType = "Columns";
				num = (a == 12)? '3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36' : ((a == 25)? '2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35' : '1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34');
				removeBet(this, num, objType, 2);
			}
		};
		var nbn = document.createElement('div');
		nbn.setAttribute('class', 'nbn');
		nbn.innerText = numberBlocks[i];
		numberBlock.append(nbn);
		numberBoard.append(numberBlock);
	}
	bettingBoard.append(numberBoard);

	// the bottom options of the board '1 to 12' '13 to 24' and '25 to 36' are created here 
	let bo3Board = document.createElement('div');
	bo3Board.setAttribute('class', 'bo3_board');	
	let bo3Blocks = ['1 to 12', '13 to 24', '25 to 36'];
	for(i = 0; i < bo3Blocks.length; i++){
		let b = i;
		var bo3Block = document.createElement('div');
		bo3Block.setAttribute('class', 'bo3_block');
		bo3Block.onclick = function(){
			var objType = "Dozens";
			num = (b == 0)? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12' : ((b == 1)? '13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24' : '25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36');
			setBet(this, num, objType, 2);
		};
		bo3Block.oncontextmenu = function(e){
			e.preventDefault();
			var objType = "Dozens";
			num = (b == 0)? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12' : ((b == 1)? '13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24' : '25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36');
			removeBet(this, num, objType, 2);
		};
		bo3Block.innerText = bo3Blocks[i];
		bo3Board.append(bo3Block);
	}
	bettingBoard.append(bo3Board);

	// This creates the EVEN, RED, BLACK, ODD bet blocks on the bottom of the board and utizlizes an array to determine what numbers to pass into the SETBET func 
	let otoBoard = document.createElement('div');
	otoBoard.setAttribute('class', 'oto_board');	
	let otoBlocks = ['EVEN', 'RED', 'BLACK', 'ODD'];
	for(i = 0; i < otoBlocks.length; i++){
		let d = i;
		var colourClass = (otoBlocks[i] == 'RED')? ' redNum' : ((otoBlocks[i] == 'BLACK')? ' blackNum' : '');
		var otoBlock = document.createElement('div');
		otoBlock.setAttribute('class', 'oto_block' + colourClass);
		otoBlock.onclick = function(){
			
			num = (d == 0)? '2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36' : ((d == 1)? '1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36' : ((d == 2)? '2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35' : '1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35'));
			var objType = (d == 0)? 'Even' : ((d == 1)? 'Red' : ((d == 2)? 'Black' : 'Odd'));
			setBet(this, num, objType, 1);
		};
		otoBlock.oncontextmenu = function(e){
			num = (d == 0)? '2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36' : ((d == 1)? '1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36' : ((d == 2)? '2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35' : '1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35'));
			var objType = (d == 0)? 'Even' : ((d == 1)? 'Red' : ((d == 2)? 'Black' : 'Odd'));
			e.preventDefault();
			removeBet(this, num, objType, 1);
		};
		otoBlock.innerText = otoBlocks[i];
		otoBoard.append(otoBlock);
	}
	bettingBoard.append(otoBoard);
	// this part of the func is builidng the chip deck div and the individual chip decks while also assigning cdActiveChip class to the currently clicked chip. "Selected Animation"
	let chipDeck = document.createElement('div');
	chipDeck.setAttribute('class', 'chipDeck');
	let chipValues = [1, 5, 10, 100, 'clear'];
	for(i = 0; i < chipValues.length; i++){
		let cvi = i;
		let chipColour = (i == 0)? 'red' : ((i == 1)? 'blue cdChipActive' : ((i == 2)? 'orange' : ((i == 3)? 'gold' : 'clearBet')));
		let chip = document.createElement('div');
		chip.setAttribute('class', 'cdChip ' + chipColour);
		chip.setAttribute('id', chipColour);
		chip.onclick = function(){
			if(cvi !== 4){ // this logic here is being utilized to identifiy the currently selected chip within the cdChipActiveClass
				let cdChipActive = document.getElementsByClassName('cdChipActive');
				for(i = 0; i < cdChipActive.length; i++){
					cdChipActive[i].classList.remove('cdChipActive'); // if the chip selected is already the current active chip, remove the cdChipActive class and re-declare
				}
				let curClass = this.getAttribute('class');
				if(!curClass.includes('cdChipActive')){
					this.setAttribute('class', curClass + ' cdChipActive');
				}
				wager = parseInt(chip.childNodes[0].innerText);
			}else{ // in the case of the clear button being hit , the bet value is returned to the bank value and current bet is set to 0
				bankValue = bankValue + currentBet;
				currentBet = 0;
				document.getElementById('bankSpan').innerText = '' + bankValue.toLocaleString("en-GB") + '';
				document.getElementById('betSpan').innerText = '' + currentBet.toLocaleString("en-GB") + '';
				clearBet();
				removeChips();
			}
		};
		let chipSpan = document.createElement('span');
		chipSpan.setAttribute('class', 'cdChipSpan');
		chipSpan.innerText = chipValues[i];
		chip.append(chipSpan);
		chipDeck.append(chip);
	}
	bettingBoard.append(chipDeck);

	// the Bank value and Current bet value are housed within the Bank container, manipulating the bankvalue global variable will manipulate the bank value displayed within this bank container 
	let bankContainer = document.createElement('div');
	bankContainer.setAttribute('class', 'bankContainer');

	let bank = document.createElement('div');
	bank.setAttribute('class', 'bank');
	let bankSpan = document.createElement('span');
	bankSpan.setAttribute('id', 'bankSpan');
	bankSpan.innerText = '' + bankValue.toLocaleString("en-GB") + '';
	bank.append(bankSpan);
	bankContainer.append(bank);

	let bet = document.createElement('div');
	bet.setAttribute('class', 'bet');
	let betSpan = document.createElement('span');
	betSpan.setAttribute('id', 'betSpan');
	betSpan.innerText = '' + currentBet.toLocaleString("en-GB") + '';
	bet.append(betSpan);
	bankContainer.append(bet);	
	bettingBoard.append(bankContainer);

	// ???? 
	let pnBlock = document.createElement('div');
	pnBlock.setAttribute('class', 'pnBlock');
	let pnContent = document.createElement('div');
	pnContent.setAttribute('id', 'pnContent');
	pnContent.onwheel = function(e){
		e.preventDefault();
		pnContent.scrollLeft += e.deltaY;
	};
	pnBlock.append(pnContent);	
	bettingBoard.append(pnBlock);
	
	container.append(bettingBoard);
}

function clearBet(){
	bet = [];
	numbersBet = [];
}

// This func handles the apprearance of the spin button once bets are placed, the adjusting of bank value once bets are placed, the value of the current bet, 
function setBet(e, n, t, o){
	lastWager = wager;
	wager = (bankValue < wager)? bankValue : wager; // here is where if the bank value is LESS than the wager than the entire bank value is changed, we want to change this so that if the bank value is less than wager, a notification highlighting not enough funds is displayed 
	if(wager > 0){
		if(!container.querySelector('.spinBtn')){ // if the class spinBtn does not currently exist, create the button here and append to the container
			let spinBtn = document.createElement('div');
			spinBtn.setAttribute('class', 'spinBtn');
			spinBtn.innerText = 'spin';
			spinBtn.onclick = function(){ // once the button is clicked and the wheel is spun, the button is removed until another bet is set 
				this.remove();
				spin();
			};
			container.append(spinBtn);
		}
		bankValue = bankValue - wager;
		currentBet = currentBet + wager;
		document.getElementById('bankSpan').innerText = '' + bankValue.toLocaleString("en-GB") + ''; // bank and bet values are automatically readjusted once bets are placed 
		document.getElementById('betSpan').innerText = '' + currentBet.toLocaleString("en-GB") + '';
		// showing an increase amount in chip value once one chip exists
		for(i = 0; i < bet.length; i++){
			if(bet[i].numbers == n && bet[i].type == t){
				bet[i].amt = bet[i].amt + wager;
				let chipColour = (bet[i].amt < 5)? 'red' : ((bet[i].amt < 10)? 'blue' : ((bet[i].amt < 100)? 'orange' : 'gold'));
				e.querySelector('.chip').style.cssText = '';
				e.querySelector('.chip').setAttribute('class', 'chip ' + chipColour);
				let chipSpan = e.querySelector('.chipSpan');
				chipSpan.innerText = bet[i].amt;
				return;
			}
		}
		// everytime a bet is placed, this obj is  pushed on to the bets array 
		var obj = {
			amt: wager,
			type: t,
			odds: o,
			numbers: n
		};
		bet.push(obj);
		
		// analyze whether the numbers passed into the setBet function are present in the numbersBet array, if they arent, push 
		let numArray = n.split(',').map(Number);
		for(i = 0; i < numArray.length; i++){
			if(!numbersBet.includes(numArray[i])){
				numbersBet.push(numArray[i]);
			}
		}

		// if a chip does not exist on the current location of a bet clicked, append a chip to it 
		if(!e.querySelector('.chip')){
			let chipColour = (wager < 5)? 'red' : ((wager < 10)? 'blue' : ((wager < 100)? 'orange' : 'gold'));
			let chip = document.createElement('div');
			chip.setAttribute('class', 'chip ' + chipColour);
			let chipSpan = document.createElement('span');
			chipSpan.setAttribute('class', 'chipSpan');
			chipSpan.innerText = wager;
			chip.append(chipSpan);
			e.append(chip);
		}
	}
}

// the spin func assigns a random number to win and passes this number into spin wheel, the bank value is then updated in the case of a winning spin number in the numbers bet array 
function spin(){

	// Call to server for the winning number
	$.ajax({
		type: "POST",
		url: "/random_num",
		dataType: 'json',
		cache: false,
		async: false,
		success: function(num){
			winningSpin = num
		}, 
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus + " " + errorThrown);
		}
	});

	console.log(winningSpin);
	//POST to server for new spin_id creation and winning number for this spin_id saving
	$.ajax({
		type: "POST",
		url: "/spin_table",
		data: JSON.stringify(winningSpin),
		dataType: 'json',
		cache: false,
		success: function(msg){
			console.log(msg)
		}, 
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus + " " + errorThrown);
		}
	});

	spinWheel(winningSpin);
	setTimeout(function(){
		// if the numbersBet array contains the winning spin number, then we loop through all the bets placed and check for winners and losers depending if the numarray for given bet contains the winning spin 
		if(numbersBet.includes(winningSpin)){
			let winValue = 0;
			let betTotal = 0;
			for(i = 0; i < bet.length; i++){
				var numArray = bet[i].numbers.split(',').map(Number);
				if(numArray.includes(winningSpin)){
					bankValue = (bankValue + (bet[i].odds * bet[i].amt) + bet[i].amt);
					winValue = winValue + (bet[i].odds * bet[i].amt);
					betTotal = betTotal + bet[i].amt;
				}

			}
			win(winningSpin, winValue, betTotal); // if winValue > 0, win func detects a win and displays notification 
		}

		// sending bank value after spin to server side for database update  

		$.ajax({
			type: "POST",
			url: '/bet_table',
			data: JSON.stringify({bets: bet, bankval : bankValue}),
			dateType: 'json',
			cache: false,
			async: false,
			success: function(msg){
				console.log(msg)
			},
			error:function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus + " " + errorThrown);
			}	
		}); 

		$.ajax({
			type: "POST",
			url: '/bank_update',
			data: JSON.stringify(bankValue),
			dateType: 'json',
			cache: false,
			async: false,
			success: function(msg){
				console.log(msg)
			},
			error:function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus + " " + errorThrown);
			}	
		}); 


		currentBet = 0;
		document.getElementById('bankSpan').innerText = '' + bankValue.toLocaleString("en-GB") + '';
		document.getElementById('betSpan').innerText = '' + currentBet.toLocaleString("en-GB") + '';
		
		let pnClass = (numRed.includes(winningSpin))? 'pnRed' : ((winningSpin == 0)? 'pnGreen' : 'pnBlack'); // this handles the additon of the number generated from the spin into the pnContent block 
		let pnContent = document.getElementById('pnContent');
		let pnSpan = document.createElement('span');
		pnSpan.setAttribute('class', pnClass);
		pnSpan.innerText = winningSpin;
		pnContent.append(pnSpan);
		pnContent.scrollLeft = pnContent.scrollWidth;

		bet = []; // after every win , reset bets and remove chips 
		numbersBet = [];
		removeChips();
		document.getElementById('betting_board').style.pointerEvents = 'auto';
		wager = lastWager;
		if(bankValue == 0 && currentBet == 0){
			gameOver();
		}
	}, 10000);
}

// this func handles the display of a winning notification when a win is detected
function win(winningSpin, winValue, betTotal){
	if(winValue > 0){
		let notification = document.createElement('div');
		notification.setAttribute('id', 'notification');
			let nSpan = document.createElement('div');
			nSpan.setAttribute('class', 'nSpan');
				let nsnumber = document.createElement('span');
				nsnumber.setAttribute('class', 'nsnumber');
				nsnumber.style.cssText = (numRed.includes(winningSpin))? 'color:red' : 'color:black';
				nsnumber.innerText = winningSpin;
				nSpan.append(nsnumber);
				let nsTxt = document.createElement('span');
				nsTxt.innerText = ' Win';
				nSpan.append(nsTxt);
				let nsWin = document.createElement('div');
				nsWin.setAttribute('class', 'nsWin');
					let nsWinBlock = document.createElement('div');
					nsWinBlock.setAttribute('class', 'nsWinBlock');
					nsWinBlock.innerText = 'Bet: ' + betTotal;
					nSpan.append(nsWinBlock);
					nsWin.append(nsWinBlock);
					nsWinBlock = document.createElement('div');
					nsWinBlock.setAttribute('class', 'nsWinBlock');
					nsWinBlock.innerText = 'Win: ' + winValue;
					nSpan.append(nsWinBlock);
					nsWin.append(nsWinBlock);
					nsWinBlock = document.createElement('div');
					nsWinBlock.setAttribute('class', 'nsWinBlock');
					nsWinBlock.innerText = 'Payout: ' + (winValue + betTotal);
					nsWin.append(nsWinBlock);
				nSpan.append(nsWin);
			notification.append(nSpan);
		container.prepend(notification);
		setTimeout(function(){
			notification.style.cssText = 'opacity:0';
		}, 3000);
		setTimeout(function(){
			notification.remove();
		}, 4000);
	}
}

// this func is handling the removal of a bet by updating the bank and bet values and updating any graphical info in regards to chip display 
function removeBet(e, n, t, o){
	wager = (wager == 0)? 100 : wager;
	for(i = 0; i < bet.length; i++){
		if(bet[i].numbers == n && bet[i].type == t){
			if(bet[i].amt != 0){
				wager = (bet[i].amt > wager)? wager : bet[i].amt;
				bet[i].amt = bet[i].amt - wager;
				bankValue = bankValue + wager;
				currentBet = currentBet - wager;
				document.getElementById('bankSpan').innerText = '' + bankValue.toLocaleString("en-GB") + '';
				document.getElementById('betSpan').innerText = '' + currentBet.toLocaleString("en-GB") + '';
				if(bet[i].amt == 0){ // if bet amount at desired position is now 0 , remove chip animnation
					e.querySelector('.chip').style.cssText = 'display:none';
					console.log("bet now = 0 and should be removed");
					bet[i].type = "removed";
					// CONTINUE HERE , WHY IS BET TYPE NOT BEING SET TO 0??
				}else{ // if still a remaining bet balance after bet removal, adjust chips amount balance 
					let chipColour = (bet[i].amt < 5)? 'red' : ((bet[i].amt < 10)? 'blue' : ((bet[i].amt < 100)? 'orange' : 'gold'));
					e.querySelector('.chip').setAttribute('class', 'chip ' + chipColour);
					let chipSpan = e.querySelector('.chipSpan');
					chipSpan.innerText = bet[i].amt;
					console.log("bet not equal to 0 yet don't remove");
				}
			}
		}
	}

	if(currentBet == 0 && container.querySelector('.spinBtn')){
		document.getElementsByClassName('spinBtn')[0].remove();
	}
}

function spinWheel(winningSpin){
	document.getElementById('betting_board').style.pointerEvents = 'none';
	 
	for(i = 0; i < wheelnumbersAC.length; i++){
		if(wheelnumbersAC[i] == winningSpin){
			var degree = (i * 9.73) + 362;
		}
	}
	wheel.style.cssText = 'animation: wheelRotate 5s linear infinite;';
	ballTrack.style.cssText = 'animation: ballRotate 1s linear infinite;';

	setTimeout(function(){
		ballTrack.style.cssText = 'animation: ballRotate 2s linear infinite;';
		style = document.createElement('style');
		style.type = 'text/css';
		style.innerText = '@keyframes ballStop {from {transform: rotate(0deg);}to{transform: rotate(-'+degree+'deg);}}';
		document.head.appendChild(style);
	}, 2000);
	setTimeout(function(){
		ballTrack.style.cssText = 'animation: ballStop 3s linear;';
	}, 6000);
	setTimeout(function(){
		ballTrack.style.cssText = 'transform: rotate(-'+degree+'deg);';
	}, 9000);
	setTimeout(function(){
		wheel.style.cssText = '';
		style.remove();
	}, 10000);
}

function removeChips(){
	var chips = document.getElementsByClassName('chip');
	if(chips.length > 0){
		for(i = 0; i < chips.length; i++){
			chips[i].remove();
		}
		removeChips();
	}
}
