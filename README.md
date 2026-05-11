## Developing

Simply clone the repository, install the dependencies, and run the development server:

```
  git clone https://github.com/ninasaul/chat-gpt-ui.git
  cd chat-gpt-ui
  npm install
  npm start
```

For the Backend run:
```
  cd backend
  uv sync
  source .venv/bin/activate
  uvicorn main:app --reload
```

## Docker deployment (single container for frontend + backend)

Create a `.env` file in the project root with your API key:

```
GOOGLE_API_KEY=your_google_api_key
```

Build and run the application container:

```
docker compose up --build
```

The app will be available at `http://localhost:8000`:
- Frontend UI is served from `/`
- Backend API is served from the same host (e.g. `/health`, `/auth/*`, `/chats/*`)

## License

The UI framework is open source under the MIT license. See the LICENSE file for more information.
