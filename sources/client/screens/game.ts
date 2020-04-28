/**
 * Заголовок экрана
 */
import { GameSituationFront, Color, Cell } from "../../common/messages";

const title = document.querySelector( 'main.game h2' ) as HTMLHeadingElement;

const ARR_LETTERS : Array<string> = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const gameInfo: GameSituationFront = {
	color: 'w',
	clicked: false,
	king: false,
	to: {
		num: 0,
		let: ''
	},
	from: {
		num: 0,
		let: ''
	}
};

if ( !title )
{
	throw new Error( 'Can\'t find required elements on "game" screen' );
}


createGame();
//addFigs();
addListeners();

/**
 * Обработчик хода игрока
 */
type TurnHandler = (move: GameSituationFront) => void;

/**
 * Обработчик хода игрока
 */
let turnHandler: TurnHandler;


function createGame() : void {
	const gameboard = document.getElementById('game_board')!;
	let gamerow : HTMLElement;
	for (let i : number = 8; i >= 1; i--)
	{
		gameboard.innerHTML += '<div class="row" id="row_'+i+'"></div>';
		gamerow = document.getElementById('row_'+i+'')!;
		let letvar : string = 'a';
		gamerow.innerHTML += '<div class="cell board-num">'+i+'</div>';
		for(let j = 1; j <= 8; j++)
		{
			gamerow.innerHTML += '<div class="cell" id="cell_'+letvar+'_'+i+'"></div>';
			let temp : number = letvar.charCodeAt(0);
			temp++;
			letvar = String.fromCharCode(temp);
		}
	}
}


function addListeners() : void {
	for (let i : number = 8; i >= 1; i--)
	{
		let letvar : string = 'a';
		for(let j : number = 1; j <= 8; j++)
		{
			document.getElementById('cell_'+letvar+'_'+i)!.addEventListener('click', clickBoard, false);;
			let temp : number = letvar.charCodeAt(0);
			temp++;
			letvar = String.fromCharCode(temp);
		}
	}
}

function clickBoard(evt : Event) {
	const elem : HTMLElement = evt.target as HTMLElement;
	const classOpposite : string = (gameInfo.color === 'b' ? 'checker-white' : 'checker-black');
	let idarr : Array<string> = elem!.id.split('_');
	let cellX : string = idarr[1];
	let cellY : number = Number(idarr[2]);
	let king : boolean = false;
	let kinginit : boolean = false;
	console.log("clicked");
	if(!gameInfo.clicked && !( elem.classList.contains('checker-black') || elem.classList.contains('checker-white')))
		return;
	if(gameInfo.clicked && ( elem.classList.contains('checker-black') || elem.classList.contains('checker-white')))
	{
		gameInfo.clicked = false;
		return;
	}
	if(gameInfo.clicked && !checkDiagonal({'num': cellY, 'let': cellX}, gameInfo.from))
	{
		gameInfo.clicked = false;
		return;
	}
	if(elem!.classList.contains('king'))
	{
		kinginit = true;
	}
	if(elem.classList.contains(classOpposite))
		return;
	if(gameInfo.clicked)
	{
		if(document.getElementById('cell_'+gameInfo.from.let+'_'+gameInfo.from.num)!.classList.contains('king'))
			kinginit = true;
		gameInfo.to.num = cellY;
		gameInfo.to.let = cellX;
		king = kinginit;
		if ((Number(gameInfo.to.num) === 8) && (gameInfo.color === 'w'))
		{
			king = true;
		} else if ((Number(gameInfo.to.num) === 1) && (gameInfo.color === 'b')) {
			king = true;
		}
		gameInfo.clicked = kinginit;
		gameInfo.king = king;
		turnHandler && turnHandler( gameInfo );
	} else {
		gameInfo.from.num = cellY;
		gameInfo.from.let = cellX;
		gameInfo.clicked = true;
	}
}

function checkDiagonal(to_f : Cell, from_f : Cell) {
	return (Math.abs(Number(to_f.num) - Number(from_f.num)) === Math.abs( to_f['let'].charCodeAt(0) - from_f['let'].charCodeAt(0) ));
}

function addFiguresByField(field: Array<Array<string>>): void
{
	for (let i: number = 1; i <= 8; i++ ) {
		for(let j: number = 1; j <= 8; j++) {
			if(field[i - 1][j - 1] === '')
				continue;
			addFigure(i, j, field[i - 1][j - 1]);
		}
	}
}

function addFigure(row: number, col: number, data: string): void
{
	console.log(data);
	const type : string = (data[0] === 'w' ? 'checker-white' : 'checker-black');
	const king : string = (data[1] === 'K' ? ' king' : '');
	document.getElementById('cell_'+ARR_LETTERS[col - 1]+'_'+row)!.className = 'cell '+type+''+king;
}

function deleteFigures(): void
{
	for (let i: number = 1; i <= 8; i++ ) {
		for(let j: number = 1; j <= 8; j++) {
			document.getElementById('cell_'+ARR_LETTERS[j - 1]+'_'+i)!.className = 'cell';
		}
	}
}







/**
 * Обновляет экран игры
 *
 * @param myTurn Ход текущего игрока?
 * @param gameField игровое поле
 * @param color
 */
function update( myTurn: boolean, gameField: Array<Array<string>>, color: Color ): void
{
	console.log(gameField);
	deleteFigures();
	addFiguresByField(gameField);
	gameInfo.color = color;
	if ( myTurn )
	{
		title.textContent = 'Ваш ход';
		return;
	}
	title.textContent = 'Ход противника';
}

/**
 * Устанавливает обработчик хода игрока
 *
 * @param handler Обработчик хода игрока
 */
function setTurnHandler( handler: TurnHandler ): void
{
	turnHandler = handler;
}

export {
	update,
	setTurnHandler,
};
