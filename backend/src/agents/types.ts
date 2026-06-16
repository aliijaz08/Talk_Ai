import type {Channel, StreamChat, User} from "stream-chat"

export interface AIAgent {
    user?: User;
    channel: Channel;
    chatClient: StreamChat;
    getLastInteraction: () => number
    init: () => Promise<void>;
    dispose: () => Promise<void>;
}


export enum AgenPlatform {
    Writting_Assistant = "writting_assistant"
}

export interface WrittingMessage {
    custom?: {
        suggestions?: string[];
        writing_task?: string;
        Message_type?: "user_input" | "ai_response" | "system_message";
    }
}