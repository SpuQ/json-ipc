/*
 *  JSON IPC
 *  Exchange JSON information between two processes on the same system
 *  using named pipes (FIFO's) for inter-process communication.
 * 
 *  Copyright Sanne 'SpuQ' Santens, all rights reserved.
 */

import { execSync } from "child_process";
import {EventEmitter} from "events";
import * as fs from 'fs';

const defaultPipeFolder = '~/.pipes';

const ipc_end_message = { ipc: "end" };
const ipc_start_message = { ipc: "start" };

export class IPC_Client extends EventEmitter {
    pipeFolder:string;
    inPipePath:string;
    outPipePath:string;
    inputStream: fs.ReadStream|null;
    outputStream: fs.WriteStream|null;
    connected: boolean;
    
    constructor( isHost:boolean, name:string, pipeFolder?:string ){
        super();
        this.pipeFolder = pipeFolder?pipeFolder:defaultPipeFolder;

        this.inPipePath = this.pipeFolder +'/'+name+(isHost?'.in':'.out');
        this.outPipePath = this.pipeFolder +'/'+name+(isHost?'.out':'.in');

        this.inputStream = null;
        this.outputStream = null;

        this.connected = false;

        this.start();   // Start the IPC Client
    }

    // Send message to the IPC
    send( data:Object){
        try{
            this.outputStream?.write( JSON.stringify(data) );
        } catch( err ){
            console.error("Could not send data to IPC: "+err);
        }
    }

    // Emit data from IPC event
    private async emitDataEvent( data:string ){
        try{
            this.emit('data', JSON.parse(data) );
        } catch( err ){
            console.error("Could not emit data event: "+err);
        }
    }

    // Start the IPC
    private async start(){
        if( !await this.createPipeFolder() ) return;
        await this.end();
        await this.createPipe(this.inPipePath);
        this.createInputStream();
        await this.createPipe(this.outPipePath);
        this.createOutputStream();
        this.send( ipc_start_message );
        return;
    }

    private setConnected( connected:boolean ){
        if( connected != this.connected ){
            this.connected = connected;
            if(connected){
                this.emit('connected');
            }
            else{
                this.emit('disconnected');
            }
        }
    }

    // End the IPC
    private async end(){
        // notify the other party
        this.send( ipc_end_message );
        // close all streams
        if( this.inputStream ) this.inputStream.close();
        if( this.outputStream ) this.outputStream.close();
    }

    private async createPipeFolder(){
        try{
            // check for the existence of the pipe folder
            await fs.promises.stat( this.pipeFolder );
        } catch( err ){
            // if the pipe folder does not exist, try to create it
            // (and all its parent directories - redursive)
            try{
                await fs.promises.mkdir(this.pipeFolder, {recursive:true})
            } catch( err ){
                // If this doesn't work, that's bad...
                //console.error("ERR: unable to create pipe folder ("+this.pipeFolder+"): "+err);
                this.emit('error', 'unable to create IPC: '+ err);
                return false;
            }
        }
        return true;
    }

    private async createInputStream(){
        try{
            this.inputStream = fs.createReadStream( this.inPipePath );
        } catch( err ){
            console.error("ERR: Couldn't create input stream: "+err);
            return;
        }
        // When receiving data
        this.inputStream.on('data',(data:string) => {
            this.emitDataEvent( data );
            this.setConnected(true);
        });
        // When error, close and reopen stream
        this.inputStream.on('error', (err:any) =>{
            console.error(err);
            this.inputStream?.close();
            this.createInputStream();
        });
    }

    private async createOutputStream(){
        try{
            this.outputStream = fs.createWriteStream( this.outPipePath );
        } catch( err ){
            console.error("ERR: Couldn't create output stream: "+err);
            return;
        }
        // When error, close and reopen both streams
        // #HelloIT #HaveYouTriedToTurnItOfAndOnAgain?
        this.outputStream.on('error',( err:any ) =>{
            this.setConnected(false);
            this.start();
        });
    }

    private async createPipe( pipePath:string ){
        try{
            // Check whether this pipe exists
            await fs.promises.stat( pipePath );
        } catch( err:any ){
            try{
                // If this pipe does not exist, create it
                execSync('mkfifo '+pipePath);
            } catch( err:any ){
                //console.error("ERR: Could not create pipe ("+pipePath+"): "+err);
                this.emit('error', 'Unable to create IPC: '+err);
            }
        }
    }
}