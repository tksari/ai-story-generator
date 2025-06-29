FROM node:20-bookworm

RUN apt-get update && apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libpangocairo-1.0-0 \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  libpng-dev \
  pkg-config \
  python3 \
  python-is-python3 \
  g++ \
  make \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install typescript @types/jest module-alias --save-dev

RUN mkdir -p storage temp

EXPOSE 3000

ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["npm", "run", "dev"]