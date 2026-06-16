"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiResponseHandler = void 0;
class GeminiResponseHandler {
    constructor(genAI, chatClient, channel, message, aiUserId, userMessage, onDispose) {
        this.genAI = genAI;
        this.chatClient = chatClient;
        this.channel = channel;
        this.message = message;
        this.aiUserId = aiUserId;
        this.userMessage = userMessage;
        this.onDispose = onDispose;
        this.is_done = false;
        this.run = async () => {
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
                    if (this.is_done)
                        break;
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    // Update message every second to avoid rate limiting
                    const now = Date.now();
                    if (now - lastUpdateTime > 1000) {
                        await this.chatClient.partialUpdateMessage(this.message.id, { set: { text: fullText } }, this.aiUserId);
                        lastUpdateTime = now;
                    }
                }
                // Final update with complete text
                await this.chatClient.partialUpdateMessage(this.message.id, { set: { text: fullText } }, this.aiUserId);
                // Clear indicator
                await this.channel.sendEvent({
                    type: "ai_indicator.clear",
                    cid: cid,
                    message_id: message_id,
                    user_id: this.aiUserId,
                });
                await this.dispose();
            }
            catch (error) {
                await this.handleError(error instanceof Error ? error : new Error("Unknown error"));
            }
        };
        this.dispose = async () => {
            if (this.is_done) {
                return;
            }
            this.is_done = true;
            this.onDispose();
        };
        this.cancel = async () => {
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
        this.handleError = async (error) => {
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
            await this.chatClient.partialUpdateMessage(this.message.id, { set: { text: error.message ?? "Error generating AI response." } }, this.aiUserId);
            await this.dispose();
        };
        this.model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }
}
exports.GeminiResponseHandler = GeminiResponseHandler;
//# sourceMappingURL=GeminiResponseHandler.js.map