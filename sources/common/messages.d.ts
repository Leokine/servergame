/**
 * Начало игры
 */
export type Color = 'w' | 'b';

export type Cell = {
	num: number;
	let: string;
};

export type GameSituationFront = {
	clicked: boolean;
	color: Color;
	to: Cell;
	from: Cell;
	king: boolean
};

export type GameStartedMessage = {
	/** Тип сообщения */
	type: 'gameStarted';
	/** Мой ход? */
	myTurn: boolean;
	/** игровое поле */
	gameField: Array<Array<string>>;
	/** цвет игрока */
	color: Color;
};

/**
 * Игра прервана
 */
export type GameAbortedMessage = {
	/** Тип сообщения */
	type: 'gameAborted';
};

/**
 * Ход игрока
 */
export type PlayerMoveMessage = {
	/** Тип сообщения */
	type: 'playerMove';
	/** Число, названное игроком */
	move: GameSituationFront;
};

/**
 * Результат хода игроков
 */
export type GameResultMessage = {
	/** Тип сообщения */
	type: 'gameResult';
	/** Победа? */
	win: boolean;
};

/**
 * Смена игрока
 */
export type ChangePlayerMessage = {
	/** Тип сообщения */
	type: 'changePlayer';
	/** Мой ход? */
	myTurn: boolean;
	/** игровое поле */
	gameField: Array<Array<string>>;
	/** цвет игрока */
	color: Color;
};

/**
 * Повтор игры
 */
export type RepeatGame = {
	/** Тип сообщения */
	type: 'repeatGame';
};

/**
 * Некорректный запрос клиента
 */
export type IncorrectRequestMessage = {
	/** Тип сообщения */
	type: 'incorrectRequest';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Некорректный ответ сервера
 */
export type IncorrectResponseMessage = {
	/** Тип сообщения */
	type: 'incorrectResponse';
	/** Сообщение об ошибке */
	message: string;
};




/**
 * Сообщения от сервера к клиенту
 */
export type AnyServerMessage =
	| GameStartedMessage
	| GameAbortedMessage
	| GameResultMessage
	| ChangePlayerMessage
	| IncorrectRequestMessage
	| IncorrectResponseMessage;

/** 
 * Сообщения от клиента к серверу
 */
export type AnyClientMessage =
	| PlayerMoveMessage
	| RepeatGame
	| IncorrectRequestMessage
	| IncorrectResponseMessage;
