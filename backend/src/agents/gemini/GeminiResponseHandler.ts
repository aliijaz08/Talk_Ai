import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { Channel, MessageResponse, StreamChat } from "stream-chat";

export class GeminiResponseHandler {
    private is_done = false;
    private model: GenerativeModel;

    constructor(
        private readonly genAI: GoogleGenerativeAI,
        private readonly chatClient: StreamChat,
        private readonly channel: Channel,
        private readonly message: MessageResponse,
        private readonly aiUserId: string,
        private readonly userMessage: string,
        private readonly onDispose: () => void
    ) {
        this.model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }

    run = async () => {
        const { cid, id: message_id } = this.message;

        try {
            // Send "generating" indicator
            await this.channel.sendEvent({
                type: "ai_indicator.update",
                ai_state: "AI_STATE_GENERATING",
                cid: cid,
                message_id: message_id,
                user_id: this.aiUserId,
            });

            // Generate content with streaming
            const result = await this.model.generateContentStream(this.userMessage);

            let fullText = "";
            let lastUpdateTime = 0;

            for await (const chunk of result.stream) {
                if (this.is_done) break;

                const chunkText = chunk.text();
                fullText += chunkText;

                // Update message every second to avoid rate limiting
                const now = Date.now();
                if (now - lastUpdateTime > 1000) {
                    await this.chatClient.partialUpdateMessage(
                        this.message.id,
                        { set: { text: fullText } },
                        this.aiUserId
                    );
                    lastUpdateTime = now;
                }
            }

            // Final update with complete text
            await this.chatClient.partialUpdateMessage(
                this.message.id,
                { set: { text: fullText } },
                this.aiUserId
            );

            // Clear indicator
            await this.channel.sendEvent({
                type: "ai_indicator.clear",
                cid: cid,
                message_id: message_id,
                user_id: this.aiUserId,
            });

            await this.dispose();
        } catch (error) {
            await this.handleError(error instanceof Error ? error : new Error("Unknown error"));
        }
    };

    dispose = async () => {
        if (this.is_done) {
            return;
        }
        this.is_done = true;
        this.onDispose();
    };

    cancel = async () => {
        if (this.is_done) {
            return;
        }

        await this.channel.sendEvent({
            type: "ai_indicator.clear",
            cid: this.message.cid,
            message_id: this.message.id,
            user_id: this.aiUserId,
        });

        await this.dispose();
    };

    private handleError = async (error: Error) => {
        if (this.is_done) {
            return;
        }

        await this.channel.sendEvent({
            type: "ai_indicator.update",
            ai_state: "AI_STATE_ERROR",
            cid: this.message.cid,
            message_id: this.message.id,
            user_id: this.aiUserId,
        });

        await this.chatClient.partialUpdateMessage(
            this.message.id,
            { set: { text: error.message ?? "Error generating AI response." } },
            this.aiUserId
        );

        await this.dispose();
    };
}
