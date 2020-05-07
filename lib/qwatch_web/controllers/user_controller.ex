defmodule QwatchWeb.UserController do
  use QwatchWeb, :controller

  alias Qwatch.Accounts
  alias Qwatch.Rooms

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
    filters = %{
      user_id: conn.assigns[:current_user].id
    }
    rooms = Rooms.get_rooms(filters, %{preload: [:current_link, :user]})

    render conn, "user_rooms.html", rooms: rooms
  end
end
