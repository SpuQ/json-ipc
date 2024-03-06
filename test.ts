import { IPC_Client } from "./json-ipc";

const host = new IPC_Client( true, "test","./pipes");
const client = new IPC_Client( false, "test","./pipes");

host.on('data', (data:object)=>{
    console.log(data);
});

client.on('data', (data:object) =>{
    console.log(data);
});

setInterval(()=>{
    host.send( {fromHost:"blub"} );
    client.send({fromClient:"zeemeermin"});
},2000);
