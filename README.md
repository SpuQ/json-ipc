# JSON Inter-Process Communication
Exchange JSON information between two processes on the same system using named pipes (FIFO's) for inter-process communication.

## Install
Install using npm
```
npm install --save @spuq/json-ipc
npm install --save-dev @types/spuq__json-ipc
```

## Usage
The connection for bi-directional communication two processes. The code is for both sides the same, except for the 'isHost' bit. It does not matter on which of the two, as long as one is host, and the other isn't. Here's the basics for using this package:
```
import { IPC_Client } from "@spuq/json-ipc";
const ipc = new IPC_Client( [true|false] , "myIpcName","/my/pipe/location");

// receiving data from the other process
ipc.on('data', (data:object)=>{
    console.log(data);
});

// sending data to the other proces
ipc.send( [JSON object] );

// Connection status

ipc.on('connected', ()=>{
    console.log("Other process connected");
});

ipc.on('disconnected', ()=>{
    console.log("Other process disconnected");
});
```

## License & Contribution
Copyright Sanne 'SpuQ' Santens, all rights reserved.