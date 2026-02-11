FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Настраиваем npm для работы с нестабильной сетью: увеличиваем таймауты и добавляем retry
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Используем npm install вместо npm ci для более гибкой установки зависимостей
# с retry логикой для надежности при нестабильной сети
RUN set -e; \
    for i in 1 2 3; do \
        npm install --legacy-peer-deps --no-fund --no-audit && break || \
        (echo "Attempt $i failed, retrying..." && sleep 10); \
    done

# Проверяем, что критичные зависимости установлены
RUN npm list react-router-dom || (echo "react-router-dom not found, reinstalling..." && npm install react-router-dom@^7.0.2 --legacy-peer-deps --no-fund --no-audit)

COPY . .

RUN npm run build

FROM node:20-alpine AS dev

WORKDIR /app

# Настраиваем npm для работы с нестабильной сетью
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости для dev режима
RUN set -e; \
    for i in 1 2 3; do \
        npm install --legacy-peer-deps --no-fund --no-audit && break || \
        (echo "Attempt $i failed, retrying..." && sleep 10); \
    done

# Явно проверяем и устанавливаем критичные зависимости если они отсутствуют
RUN npm list react-router-dom 2>/dev/null || npm install react-router-dom@^7.0.2 --legacy-peer-deps --no-fund --no-audit
RUN npm list react 2>/dev/null || npm install react@^19.2.0 --legacy-peer-deps --no-fund --no-audit
RUN npm list react-dom 2>/dev/null || npm install react-dom@^19.2.0 --legacy-peer-deps --no-fund --no-audit

# Проверяем установку критичных пакетов
RUN ls -la node_modules | grep react-router-dom || (echo "ERROR: react-router-dom not found!" && exit 1)
RUN ls -la node_modules | grep react || (echo "ERROR: react not found!" && exit 1)

# Копируем остальные файлы (node_modules исключены через .dockerignore)
COPY . .

EXPOSE 5173

# Проверяем наличие критичных зависимостей перед запуском
RUN if [ ! -d "node_modules/react-router-dom" ]; then \
        echo "WARNING: react-router-dom not found, reinstalling..." && \
        npm install react-router-dom@^7.0.2 --legacy-peer-deps --no-fund --no-audit; \
    fi

CMD ["sh", "-c", "if [ ! -d 'node_modules/react-router-dom' ]; then npm install --legacy-peer-deps --no-fund --no-audit; fi && npm run dev -- --host 0.0.0.0"]
