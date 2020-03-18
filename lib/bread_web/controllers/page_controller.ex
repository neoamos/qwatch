defmodule BreadWeb.PageController do
  use BreadWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
