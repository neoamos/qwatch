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
      render conn, "room_react.html", room: room, layout: {BreadWeb.LayoutView, "room_layout.html"}
    else
      conn
      |> put_flash(:error, "Room does not exist")
      |> redirect(to: "/")
    end
  end

  def new conn, _params do
    if conn.assigns[:current_user] do
      changeset = Room.changeset(%Room{unregistered_users_allowed: true, privacy: 0}, %{})
      render conn, "new.html", changeset: changeset
    else
      conn
      |> redirect(to: "/sessions/new")
    end
  end

  def create conn, %{"room" => room_attrs} do
    room_attrs = Map.put(room_attrs, "user_id", conn.assigns[:current_user].id)
    case Rooms.create_room(room_attrs) do
      {:ok, room} -> redirect(conn, to: "/r/" <> room.name)
      {:error, changeset} ->
        conn
        |> render("new.html", changeset: changeset)
    end
  end

  def edit_form conn, %{"name" => room_name} do
    room = Rooms.get_room({:name, room_name})
    if room do
      if room.user_id == conn.assigns[:current_user].id do
        render conn, "edit.html", changeset: Room.edit_changeset(room, %{})
      else
        conn
        |> put_flash(:error, "You cant edit someone elses room")
        |> redirect(to: "/")
      end
    else
      conn
      |> put_flash(:error, "Room does not exist")
      |> redirect(to: "/")
    end
  end

  def edit conn, %{"room" => room_attrs} do
    case Rooms.edit(room_attrs) do
      {:ok, room} -> 
        conn
        |> put_flash(:ok, "Room changed succesfully")
        |> redirect(to: "/r/" <> room.name)

      {:error, %Ecto.Changeset{} = changeset} ->
        IO.inspect(changeset)
        render(conn, "edit.html", changeset: changeset)
    end
  end
end
