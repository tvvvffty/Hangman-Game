import React, {Component, useEffect, useState, useRef} from 'react';
import ReactDOM from "react-dom/client";
import './hangman.css';
import { randomWord } from './words';
import io from 'socket.io-client';
import Picker from 'emoji-picker-react';


import step0 from './hangman_images/step0.png'
import step1 from './hangman_images/step1.png'
import step2 from './hangman_images/step2.png'
import step3 from './hangman_images/step3.png'
import step4 from './hangman_images/step4.png'
import step5 from './hangman_images/step5.png'
import step6 from './hangman_images/step6.png'
import step7 from './hangman_images/step7.png'

const socket = io("http://localhost:5000");


class Hangman extends Component{
    static defaultProps = {
        maxWrong: 7,
        images: [step0, step1, step2, step3, step4, step5, step6, step7]
    }

    constructor(props){
        super(props);
        this.state = {
            mistake: 0,
            guessed: new Set([]), 
            answer: randomWord(),
        }
    }

    handleGuess = e =>{
        let letter = e.target.value;
        this.setState(st =>({
            guessed: st.guessed.add(letter),
            mistake: st.mistake + (st.answer.includes(letter) ? 0 : 1)
        }));
    }

    guessedWord(){
        return this.state.answer.split('').map(letter => (this.state.guessed.has(letter) ? letter : ' _ ')); 
    }

    generateButtons(){
        return 'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => (
            <button class='keypad' key={letter} value={letter} onClick={this.handleGuess} disabled={this.state.guessed.has(letter)}>
                {letter}
            </button>
        ));
    }

    resetButton = () => {
        this.setState({
            mistake: 0,
            guessed: new Set([]),
            answer: randomWord()
        });
    }

    render(){
        const gameOver = this.state.mistake >= this.props.maxWrong;
        const isWinner = this.guessedWord().join('') === this.state.answer;
        let gameStat = this.generateButtons();

        if (isWinner){
            gameStat = "You Won !"
        }

        if (gameOver){
            gameStat = "You Lost !"
        }

        return(
            <div className='Hangman_contain' style={{paddingBottom: 25,}}>
                <h1 className='text-center'>Hangman</h1>
                <div className='float-right'>Wrong Guesses: {this.state.mistake} of {this.props.maxWrong}</div>
                <div className='text-center'>
                    <img src={this.props.images[this.state.mistake]} alt=''/>
                </div>
                <div className='text-center'>
                    <p>Guess The Country:</p>
                    <p>
                        {!gameOver ? this.guessedWord() : this.state.answer}
                    </p>
                    <p>
                        {gameStat}
                    </p>
                    <div style={{paddingTop: 50,}}>
                    <button class='btn btn-danger' onClick={this.resetButton} style={{width: 300}}>Reset</button>
                    </div>
                    <p></p>
                    <Chat/>
                </div>
            </div>
        );
    }
}

function Chat() {
    const [socketId, setSocketId] = useState("");
    const [message, setMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [joinedRoom, setJoinedRoom] = useState(false);
    const [room, setRoom] = useState("");
    const [chat, setChat] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    //Emoji
  
    const onEmojiClick = (event, emojiObject) => {
      setMessage(message + emojiObject.emoji);
    };
    // scroll
    const chatContainer = useRef(null);
  
    useEffect(() => {
      socket.on("me", (id) => {
        setSocketId(id);
      });
  
      socket.on("disconnect", () => {
        socket.disconnect();
      });
  
      socket.on("getAllUsers", (users) => {
        setUsers(users);
      });
      // Real time
      socket.on("updateUsers", (users) => {
        setUsers(users);
      });
  
      socket.on("getAllRooms", (rooms) => {
        setRooms(rooms);
      });
      // Real time
      socket.on("updateRooms", (rooms) => {
        setRooms(rooms);
      });
  
      // Rooms
  
      socket.on("chat", (payload) => {
        setChat(payload.chat);
      });
  
      if (joinedRoom === true) {
      }
    }, [chat, rooms]);
  
    const sendMessage = async () => {
      const payload = { message, room, socketId };
      socket.emit("message", payload);
  
      setMessage("");
      socket.on("chat", (payload_2) => {
        setChat(payload_2.chat);
        // console.log(payload_2.chat);
        console.log(payload_2);
      });
      chatContainer.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      setShowEmoji(false);
    };
  
    const createRoom = () => {
      socket.emit("create_room");
      socket.on("get_room", (room) => {
        setRooms([...rooms, room]);
      });
    };
  
    const joinRoom = (room) => {
      socket.emit("join_room", room);
      setRoom(room.id);
      setJoinedRoom(true);
      //
      setChat(room.chat);
    };
  
    return (
      <>
      <div class='chatt_container' style={{paddingTop: 200,}}>
        <h1 className="my_socket">Me: {socketId}</h1>
        </div>
        <h3 className="roomjoined">
          {joinedRoom === true
            ? `Room: ${room}`
            : "You are currently not in any room"}
        </h3>
  
        {!joinedRoom && (
          <div className="container">
            <div className="users-container">
              <h2 className="users_heading">Online Users:</h2>
              <ul className="users">
                {users.map((user) => {
                  return (
                    <li className="user" key={user}>
                      {user && user === socketId ? `*ME*` : user}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rooms-container">
              <h2 className="rooms_heading">Available Rooms:</h2>
  
              {rooms.length === 0 ? (
                <h3 className="no_rooms">No Rooms! Create a room !</h3>
              ) : (
                <ul className="rooms">
                  {rooms.map((room) => {
                    return (
                      <li key={room.id} onClick={() => joinRoom(room)}>
                        {room.id}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="btnn-container">
                <button className="btnn" onClick={() => createRoom()}>
                  Create Room
                </button>
              </div>
            </div>
          </div>
        )}
  
        {joinedRoom && (
          <>
            <div className="chat-container">
              <ul className="chat-list" id="chat-list" ref={chatContainer}>
                {chat.map((chat, idx) => (
                  <li
                    key={idx}
                    className={chat.writer === socketId ? "chat-me" : "chat-user"}
                  >
                    {chat.writer === socketId
                      ? `${chat.message}: ME*`
                      : `User (${chat.writer.slice(0, 5)}): ${chat.message}`}
                  </li>
                ))}
              </ul>
            </div>
  
            <form className="chat-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Your message ..."
                autoFocus
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                value={message}
              />
  
              <button
                className="emoji_btnn"
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
              >
                Emoji
              </button>
              <button
                className="send_btnn"
                type="submit"
                onClick={() => sendMessage()}
              >
                Send
              </button>
            </form>
            {showEmoji && (
              <Picker
                onEmojiClick={onEmojiClick}
                pickerStyle={{
                  width: "20%",
                  display: "absolute",
                  left: "0",
                  bottom: "270px",
                  backgroundColor: "#fff",
                }}
              />
            )}
          </>
        )}
      </>
    );
  }
  


class HangmanGame extends Component{
    constructor(props){
        super(props);
    }
    render(){
            return(
               
                <Hangman/>
            );
        }
    }

export default HangmanGame;



