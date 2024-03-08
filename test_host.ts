import { IPC_Client } from "./src/json-ipc";

const host = new IPC_Client( true, "test","./pipes");

host.on('data', (data:object)=>{
    console.log(data);
});

host.on('connected', ()=>{
    console.log("Client connected");
});

host.on('disconnected', ()=>{
    console.log("Client disconnected");
});

setInterval(()=>{
    host.send( {fromHost:"blub"} );
},2000);
