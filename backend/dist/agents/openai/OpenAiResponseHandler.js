"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiResponseHandler = void 0;
class OpenAiResponseHandler {
    constructor(openai, openAiThread, assistantStream, chatClient, channel, message, aiUserId, onDispose) {
        this.openai = openai;
        this.openAiThread = openAiThread;
        this.assistantStream = assistantStream;
        this.chatClient = chatClient;
        this.channel = channel;
        this.message = message;
        this.aiUserId = aiUserId;
        this.onDispose = onDispose;
        this.chunk_counter = 0;
        this.run_id = "";
        this.is_done = false;
        this.last_update_time = 0;
        this.run = async () => {
            const { cid, id: message_id } = this.message;
            let isCompleted = false;
            let currentStream = this.assistantStream;
            try {
                while (!isCompleted) {
                    for await (const event of currentStream) {
                        await this.handleStreamEvent(event);
                        if (this.is_done) {
                            isCompleted = true;
                            break;
                        }
                        if (event.event === "thread.run.requires_action" &&
                            event.data.required_action?.type === "submit_tool_outputs") {
                            this.run_id = event.data.id;
                            await this.channel.sendEvent({
                                type: "ai_indicator.update",
                                ai_state: "AI_STATE_EXTERNAL_SOURCES",
                                cid: cid,
                                message_id: message_id,
                                user_id: this.aiUserId,
                            });
                            const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
                            const toolOutputs = [];
                            for (const toolcall of toolCalls) {
                                if (toolcall.function.name === "web_search") {
                                    try {
                                        const args = JSON.parse(toolcall.function.arguments);
                                        const searchResult = await this.performWebSearch(args.query);
                                        toolOutputs.push({
                                            tool_call_id: toolcall.id,
                                            output: searchResult,
                                        });
                                    }
                                    catch (e) {
                                        toolOutputs.push({
                                            tool_call_id: toolcall.id,
                                            output: JSON.stringify({
                                                error: "Failed to parse tool arguments or execute tool.",
                                            }),
                                        });
                                    }
                                }
                            }
                            currentStream = this.openai.beta.threads.runs.submitToolOutputsStream(this.run_id, {
                                thread_id: this.openAiThread.id,
                                tool_outputs: toolOutputs,
                            });
                            break;
                        }
                        if (event.event === "thread.run.completed" ||
                            event.event === "thread.run.failed" ||
                            event.event === "thread.run.cancelled" ||
                            event.event === "thread.run.expired") {
                            isCompleted = true;
                            if (event.event !== "thread.run.completed") {
                                const errorMessage = "last_error" in event.data && event.data.last_error?.message
                                    ? event.data.last_error.message
                                    : "Run ended before completion.";
                                await this.handleError(new Error(errorMessage));
                            }
                        }
                    }
                }
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
            this.chatClient.off("ai_indicator.stop", this.handleStopGenerating);
            this.onDispose();
        };
        this.cancel = async () => {
            if (this.is_done || !this.run_id) {
                return;
            }
            try {
                await this.openai.beta.threads.runs.cancel(this.run_id, {
                    thread_id: this.openAiThread.id,
                });
            }
            catch (error) {
                console.error("Error cancelling run:", error);
            }
            await this.channel.sendEvent({
                type: "ai_indicator.clear",
                cid: this.message.cid,
                message_id: this.message.id,
                user_id: this.aiUserId,
            });
            await this.dispose();
        };
        this.handleStopGenerating = async (event) => {
            if (this.is_done || event.message_id !== this.message.id) {
                return;
            }
            console.log("Stop generating for message", this.message.id);
            if (!this.openai || !this.openAiThread || !this.run_id) {
                return;
            }
            try {
                await this.openai.beta.threads.runs.cancel(this.run_id, {
                    thread_id: this.openAiThread.id,
                });
            }
            catch (error) {
                console.error("Error cancelling run:", error);
            }
            await this.channel.sendEvent({
                type: "ai_indicator.clear",
                cid: this.message.cid,
                message_id: this.message.id,
                user_id: this.aiUserId,
            });
            await this.dispose();
        };
        this.handleStreamEvent = async (event) => {
            const { cid, id } = this.message;
            if (event.event === "thread.run.created") {
                this.run_id = event.data.id;
            }
            else if (event.event === "thread.message.delta") {
                const textDelta = event.data.delta.content?.[0];
                if (textDelta?.type === "text" && textDelta.text?.value) {
                    if (!this.message.text) {
                        this.message.text = "";
                    }
                    this.message.text += textDelta.text.value;
                    const now = Date.now();
                    if (now - this.last_update_time > 1000) {
                        await this.chatClient.partialUpdateMessage(this.message.id, {
                            set: { text: this.message.text },
                        }, this.aiUserId);
                        this.last_update_time = now;
                    }
                    this.chunk_counter += 1;
                }
            }
            else if (event.event === "thread.message.completed") {
                await this.chatClient.partialUpdateMessage(id, {
                    set: {
                        text: event.data.content?.[0].type === "text"
                            ? event.data.content[0].text.value
                            : this.message.text,
                    },
                }, this.aiUserId);
                await this.channel.sendEvent({
                    type: "ai_indicator.clear",
                    cid: cid,
                    message_id: id,
                    user_id: this.aiUserId,
                });
                await this.dispose();
            }
            else if (event.event === "thread.run.step.created") {
                if (event.data.step_details.type === "tool_calls") {
                    await this.channel.sendEvent({
                        type: "ai_indicator.update",
                        ai_state: "AI_STATE_GENERATING",
                        cid: cid,
                        message_id: id,
                        user_id: this.aiUserId,
                    });
                }
            }
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
            await this.chatClient.partialUpdateMessage(this.message.id, {
                set: {
                    text: error.message ?? "Error generating AI response.",
                },
            }, this.aiUserId);
            await this.dispose();
        };
        this.performWebSearch = async (query) => {
            const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
            if (!TAVILY_API_KEY) {
                return JSON.stringify({
                    error: "Tavily API key is not configured.",
                });
            }
            console.log(`Performing a web search for ${query}`);
            try {
                const response = await fetch("https://api.tavily.com/v1/search", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${TAVILY_API_KEY}`,
                    },
                    body: JSON.stringify({
                        query: query,
                        search_depth: "advanced",
                        max_results: 5,
                        include_answers: true,
                        include_raw_content: false,
                    }),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`Tavily search failed for query ${query}: `, errorText);
                    return JSON.stringify({
                        error: `Tavily search failed with status ${response.status}`,
                        details: errorText,
                    });
                }
                const data = await response.json();
                console.log(`Tavily search successful for query ${query}`);
                return JSON.stringify(data);
            }
            catch (error) {
                console.log(`An exception occured during web search for ${query}`);
                return JSON.stringify({
                    error: "An exception occured during web search.",
                });
            }
        };
        this.chatClient.on("ai_indicator.stop", this.handleStopGenerating);
    }
}
exports.OpenAiResponseHandler = OpenAiResponseHandler;
//# sourceMappingURL=OpenAiResponseHandler.js.map