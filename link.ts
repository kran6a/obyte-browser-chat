import {TRPCClientError, type TRPCLink} from '@trpc/client';
import {observable} from '@trpc/server/observable';
import mitt from './emitter.ts';
import type {AnyTRPCRouter} from '@trpc/server';
import {Client} from 'obyte';
import ChatClient from './src/index.ts';
import { randomBytes } from 'crypto';

export type TRPCRMQLinkOptions = {
    server_pubkey: string;
    obyte_client: Client;
    testnet?: boolean;
    wif: string;
};

export const rmqLink = <TRouter extends AnyTRPCRouter>(opts: TRPCRMQLinkOptions): TRPCLink<TRouter> => {
    const responseEmitter = mitt<Record<number, any>>();
    const tempPrivKey = randomBytes(32).toString('base64');
    const prevTempPrivKey = randomBytes(32).toString('base64');
    const receiver = new ChatClient({client: opts.obyte_client, config: {testnet: opts.testnet ?? false, wif: opts.wif, name: 'Unnamed client', tempPrivKey, prevTempPrivKey}});
    receiver.onMessage((msg)=>{
        const json: {trpc: {id: number, result: {type: 'string', data: any}}} = JSON.parse(msg.body);
        responseEmitter.emit(json.trpc.id, json);
    });
    return () => {
        const sendRequest = async (message: any)=>new Promise<void>(async resolve => {
            responseEmitter.on(message.trpc.id, (ev: any)=>{
                responseEmitter.off(message.trpc.id);
                resolve(ev);
            });
            receiver.send(opts.server_pubkey, "trpc", JSON.stringify(message));
        });
        return ({op}) => {
            return observable(observer => {
                try {
                    const input = JSON.stringify(op.input);
                    const onMessage = (message: any) => {
                        if (!('trpc' in message)) return;
                        const { trpc } = message;
                        if (!trpc) return;
                        if (!('id' in trpc) || trpc.id === null || trpc.id === undefined) return;
                        if (op.id !== trpc.id) return;
                        if ('error' in trpc) {
                            observer.error(TRPCClientError.from({ ...trpc, error: trpc.error }));
                            return;
                        }
                        observer.next(trpc);
                        observer.complete();
                    };
                    sendRequest({trpc: {id: op.id, method: op.type, params: { path: op.path, input }}}).then(onMessage).catch(cause=>observer.error(new TRPCClientError(cause instanceof Error ? cause.message : 'Unknown error')));
                }
                catch (cause) {
                    observer.error(new TRPCClientError(cause instanceof Error ? cause.message : 'Unknown error'));
                }
                return ()=>{};
            });
        };
    };
};