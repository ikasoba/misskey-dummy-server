FROM denoland/deno:1.37.2

ENV PORT=8000
ENV PROXY_HOST=

WORKDIR /app
COPY . .
RUN deno cache ./main.ts

CMD sh ./execute.sh