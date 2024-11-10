import { createServer } from "http";

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/openai/completion") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { messages } = JSON.parse(body);
        
        // Make a completion request to OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(completion));
      } catch (error) {
        console.error("Error handling completion:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`HTTP server listening on http://localhost:${PORT}`);
});
