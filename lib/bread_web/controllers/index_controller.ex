
defmodule BreadWeb.IndexController do
  use BreadWeb, :controller

  alias Bread.Rooms
  def index(conn, _params) do
    rooms = Rooms.get_rooms(%{limit: 100, preload: [:current_link, :user]})
    render(conn, "index.html", rooms: rooms)
  end
end
