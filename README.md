# A Viagem do Monstro das Cores

Site e jogo online. Um único servidor Node serve o site e liga os jogadores por WebSocket.

## Correr no computador

```
npm install
npm start
```

Abre http://localhost:3000. Para testar o online, abre o endereço em dois separadores.

## Pôr online

O servidor tem de correr sempre (não serve alojamento só de ficheiros, como o GitHub Pages ou o Netlify, porque o online precisa de WebSocket).

**Render (grátis):**
1. Cria um repositório no GitHub com o conteúdo desta pasta.
2. No Render: New > Blueprint (ou Web Service), escolhe o repositório. O ficheiro `render.yaml` já tem tudo.
3. Quando acabar, o endereço `https://...onrender.com` é o teu site. No plano grátis o servidor adormece após alguns minutos sem uso e demora cerca de um minuto a acordar no primeiro acesso.

**Railway, Fly.io ou um servidor próprio:** funciona com o `Dockerfile` incluído, ou com `npm start`. Usa a porta da variável `PORT`.

## Notas

- Domínio próprio: configura-o no serviço que escolheres. O site e o jogo usam o mesmo endereço, por isso não há nada a alterar no código.
- `ALLOWED_ORIGINS` (opcional): lista de origens permitidas para o WebSocket, separadas por vírgulas, por exemplo `https://o-meu-dominio.pt`. Sem isto, qualquer origem liga.
- Limites: 500 salas em simultâneo, 8 pessoas por sala, o jogo usa de 2 a 5.
- O servidor só reencaminha mensagens dentro da sala e não guarda nada. As regras correm no dispositivo de quem criou a sala. Se essa pessoa sair, a sala fecha.
- Saúde do serviço: `/healthz`.
