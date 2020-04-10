
defmodule BreadWeb.IndexController do
  use BreadWeb, :controller

  alias Bread.Rooms
  def index(conn, params) do
    rooms = Rooms.get_rooms(%{limit: 100, preload: [:current_link, :user], open: true})
      |> Enum.map(fn r ->
        count = Bread.Presence.get_user_count(r.name)
        {r, count}
      end)
      |> Enum.sort(fn {_, count1}, {_, count2} -> count1>count2 end)

    render(conn, "index.html", rooms: rooms, message: params["message"])
  end
end
