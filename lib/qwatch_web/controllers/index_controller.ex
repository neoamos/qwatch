
defmodule QwatchWeb.IndexController do
  use QwatchWeb, :controller

  alias Qwatch.Rooms
  def index(conn, params) do
    unregistered_users_allowed = !conn.assigns[:current_users]
    filters = %{
      open: true,
      public: true,
      unregistered_users_allowed: !conn.assigns[:current_user]
    }
    rooms = Rooms.get_rooms(filters, %{limit: 100, preload: [:current_link, :user]})
      |> Enum.map(fn r ->
        count = Qwatch.Presence.get_user_count(r.name)
        {r, count}
      end)
      |> Enum.filter(fn {r, count} -> 
        count > 0 or r.name=="DemoRoom"
      end)
      |> Enum.sort(fn {_, count1}, {_, count2} -> count1>count2 end)

    render(conn, "index.html", rooms: rooms, message: params["message"])
  end
end
