import axios from "axios";

const apiKey = "";

export const getGPTResponse = async (prompt: string) => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // console.log("response: " + response.data.choices[0].message.content);

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error from OpenAI:", error);
        return "Something went wrong...";
    }
};
