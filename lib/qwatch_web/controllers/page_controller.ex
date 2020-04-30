defmodule QwatchWeb.PageController do
  use QwatchWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
