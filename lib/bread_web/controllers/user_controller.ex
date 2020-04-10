defmodule BreadWeb.UserController do
  use BreadWeb, :controller

  alias Bread.Accounts
  alias Bread.Rooms

  def profile(conn, %{"name" => name}) do
    case Accounts.get_user({:name, name}) do
      {:ok, user} -> 
        render conn, "profile.html", user: user
      _ -> 
        conn
        |> put_flash(:error, "User does not exist")
        |> redirect(to: "/")
    end
  end

  def user_rooms(conn, _) do
    rooms = Rooms.get_rooms(%{preload: [:current_link, :user], user_id: conn.assigns[:current_user].id})

    render conn, "user_rooms.html", rooms: rooms
  end
end
