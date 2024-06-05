import {type AnyTRPCRouter, TRPCError, callTRPCProcedure, type inferRouterContext, getTRPCErrorFromUnknown} from '@trpc/server';
import Client from './src/index.ts';
  
export type CreateRMQHandlerOptions<TRouter extends AnyTRPCRouter> = {
    router: TRouter;
    obyte_client: Client
    createContext: (input: {pubkey: string})=>inferRouterContext<TRouter>;
};
  
async function handleMessage<TRouter extends AnyTRPCRouter>(router: TRouter, msg: string, ctx: inferRouterContext<TRouter>) {
    try {
        const message = JSON.parse(msg);
        if (!('trpc' in message))
            return;
        if (!('id' in message.trpc) || message.trpc.id === null || message.trpc.id === undefined)
            return;
        if (!message.trpc)
            return;
  
        try {
            if (!message.trpc.params.path) {
                throw new Error('No path provided');
            }
            if (message.trpc.method === 'subscription') {
                throw new TRPCError({message: 'Obyte link does not support subscriptions (yet?)', code: 'METHOD_NOT_SUPPORTED'});
            }
            const input = typeof message.trpc.params.input !== 'undefined' ? JSON.parse(message.trpc.params.input) : message.trpc.params.input;
            const output = await callTRPCProcedure({
                procedures: router._def.procedures,
                path: message.trpc.params.path,
                getRawInput(){
                    return input;
                },
                ctx,
                type: message.trpc.method
            });
            return {trpc: {id: message.trpc.id, result: {type: 'data', data: output}}};
        }
        catch (cause) {
            const error = getTRPCErrorFromUnknown(cause);
            return {trpc: {id: message.trpc.id, error: {error, type: message.trpc.method, path: message.trpc?.path, input: message.trpc?.input, ctx}}};
        }
    }
    catch (cause) {
        return void console.error(cause);
    }
}

export const createObyteHandler = <TRouter extends AnyTRPCRouter>(opts: CreateRMQHandlerOptions<TRouter>)=>opts.obyte_client.onMessage(async (msg)=>{
    opts.obyte_client.send(msg.sender, 'trpc', JSON.stringify(await handleMessage(opts.router, msg.body, opts.createContext({pubkey: msg.sender}))));
});