#!/bin/bash
# start.sh

# uv を使用して仮想環境内でバックエンドサーバーをバックグラウンドで起動
uv run -- uvicorn application:app --reload --port 8000 &
backend_pid=$!

# フロントエンドサーバーを起動
cd ui
npm run dev &
frontend_pid=$!
cd ..

echo "アプリケーションを起動しました"
echo "フロントエンド: http://localhost:5173"
echo "バックエンド: http://localhost:8000"
echo "Ctrl+Cで終了します"

# スクリプト終了時にプロセスを終了
trap 'kill $backend_pid $frontend_pid 2>/dev/null' EXIT

# スクリプトを実行し続ける
wait

