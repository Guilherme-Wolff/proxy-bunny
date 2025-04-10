import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.11";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("Starting Bunkr.site video proxy server...");
const listener = BunnySDK.net.tcp.unstable_new();

console.log("Listening on: ", BunnySDK.net.tcp.toString(listener));
BunnySDK.net.http.serve(
  async (req) => {
    const url = new URL(req.url);
    console.log(`[INFO]: ${req.method} - ${req.url}`);
    
    try {
      // Extrair o parâmetro 'url' da query string
      const targetUrlParam = url.searchParams.get("url");
      
      // Verificar se o parâmetro 'url' foi fornecido
      if (!targetUrlParam) {
        return new Response("Error: Missing 'url' parameter. Use /?url=https://bunkr.site/path/to/video", { 
          status: 400 
        });
      }
      
      // Decodificar a URL se estiver codificada
      let targetUrl;
      try {
        targetUrl = decodeURIComponent(targetUrlParam);
      } catch (e) {
        targetUrl = targetUrlParam; // Usar como está se não estiver codificada
      }
      
      // Validar se a URL é válida e se é do domínio bunkr.site
      try {
        const parsedUrl = new URL(targetUrl);
        if (!parsedUrl.hostname.includes("bunkr.site")) {
          return new Response("Error: URL must be from bunkr.site domain", { 
            status: 400 
          });
        }
      } catch (e) {
        return new Response(`Error: Invalid URL - ${targetUrl}`, { 
          status: 400 
        });
      }
      
      console.log(`[INFO]: Proxying request to ${targetUrl}`);
      
      // Configurar os cabeçalhos com o Referer correto
      const headers = new Headers(req.headers);
      headers.set("Referer", "https://bunkr.site");
      
      // Remover cabeçalhos que podem causar problemas
      headers.delete("host");
      
      // Criar e enviar a solicitação 
      const fetchOptions = {
        method: req.method,
        headers: headers
      };
      
      await sleep(1); // Pequeno atraso conforme solicitado
      
      // Fazer a solicitação ao servidor de destino
      const response = await fetch(targetUrl, fetchOptions);
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        console.error(`[ERROR]: Failed to fetch from bunkr.site. Status: ${response.status}`);
        return new Response(`Error: Failed to fetch video from bunkr.site. Status: ${response.status}`, { 
          status: response.status 
        });
      }
      
      // Criar uma nova resposta com os dados recebidos
      const responseHeaders = new Headers(response.headers);
      
      // Garantir que os cabeçalhos de conteúdo sejam preservados para vídeos
      if (responseHeaders.has("content-type")) {
        console.log(`[INFO]: Content-Type: ${responseHeaders.get("content-type")}`);
      }
      
      // Retornar a resposta para o cliente
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      console.error(`[ERROR]: ${error.message}`);
      return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
  },
);