defmodule BreadWeb.RoomController do
  use BreadWeb, :controller

  alias Bread.Rooms
  alias Bread.Rooms.Room

  def room(conn, %{"name" => name}) do
    room = Rooms.get_room({:name, name}, preload: [:user])
    if room do
      render conn, "room.html", room: room
    else
      conn
      |> put_flash(:error, "Room does not exist")
      |> redirect(to: "/")
    end
  end

  def room_react(conn, %{"name" => name}) do
    room = Rooms.get_room({:name, name}, preload: [:user])
    if room do
      render conn, "room_react.html", room: room
    else
      conn
      |> put_flash(:error, "Room does not exist")
      |> redirect(to: "/")
    end
  end

  def new conn, _params do
    changeset = Room.changeset(%Room{})
    render conn, "new.html", changeset: changeset
  end

  def create conn, %{"room" => room_attrs} do
    room_attrs = Map.put(room_attrs, "user_id", conn.assigns[:current_user].id)
    case Rooms.create_room(room_attrs) do
      {:ok, room} -> redirect(conn, to: "/r/" <> room.name)
      {:error, changeset} ->
        conn
        |> render "new.html", changeset: changeset
    end
  end
end
