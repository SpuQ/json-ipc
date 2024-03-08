import { IPC_Client } from "./src/json-ipc";

const client = new IPC_Client( false, "test","./pipes");

client.on('data', (data:object) =>{
    console.log(data);
});

client.on('connected', ()=>{
    console.log("Host connected");
});

client.on('disconnected', ()=>{
    console.log("Host disconnected");
});

setInterval(()=>{
    client.send({fromClient:"zeemeermin"});
},2000);
