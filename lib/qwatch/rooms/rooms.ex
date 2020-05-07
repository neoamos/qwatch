defmodule Qwatch.Rooms do
  import Ecto.Query, warn: false
  alias Qwatch.Repo

  alias Qwatch.Rooms.Room
  alias Qwatch.Rooms.Link
  alias Qwatch.Rooms.Links
  alias Qwatch.LinkFetcher
  alias Qwatch.Rooms.RoomServer

  def create_room attrs do
    attrs = if attrs["name"] == "" do
      attrs = Map.put(attrs, "name", :crypto.strong_rand_bytes(12) |> Base.url_encode64 |> binary_part(0, 12))
      Map.put(attrs, "custom_url", false)
    else
      Map.put(attrs, "custom_url", true)
    end

    attrs = Map.put(attrs, "privacy", (if attrs["public"] == "true", do: 0, else: 1))
    %Room{}
    |> Room.changeset(attrs)
    |> Repo.insert()
  end

  def edit attrs do
    attrs = Map.put(attrs, "privacy", (if attrs["public"] == "true", do: 0, else: 1))

    room = get_room({:id, attrs["id"]})
    res = room
    |> Room.edit_changeset(attrs)
    |> Repo.update

    case res do
      {:ok, room} ->
        RoomServer.update_room(room.name)
        {:ok, room}
      other -> other
    end
  end

  def create_link attrs do
    %Link{}
    |> Link.changeset(attrs)
    |> Repo.insert()
  end

  def update_room room_name, attrs do
    room = get_room({:name, room_name})
    if room do
      room
      |> Room.edit_changeset(attrs)
      |> Repo.update()
    else
      {:error, "Room does not exist"}
    end
  end

  def get_room identifier, params \\ %{}

  def get_room {:name, name}, params do
    query = from r in Room, where: r.name==^name

    query = if params[:preload] do
      from r in query, preload: ^params[:preload]
    else
      query
    end

    Repo.one(query)
  end

  def get_room {:id, id}, params do
    query = from r in Room, where: r.id==^id

    query = if params[:preload] do
      from r in query, preload: ^params[:preload]
    else
      query
    end

    Repo.one(query)
  end

  def get_rooms filters, params \\ %{} do
    query =  from r in Room

    query = if params[:limit] do
      from r in query, limit: ^params[:limit]
    else
      query
    end

    query = if params[:preload] do
      from r in query, preload: ^params[:preload]
    else
      query
    end

    query = if filters[:open] do
      from r in query, where: r.open == true
    else
      query
    end 

    query = if filters[:public] do
      from r in query, where: r.privacy == 0
    else
      query
    end 

    query = if filters[:unregistered_users_allowed] do
      from r in query, where: r.unregistered_users_allowed == true
    else
      query
    end 

    query = if filters[:user_id] do
      from r in query, where: r.user_id == ^filters[:user_id]
    else
      query
    end 

    Repo.all(query)
  end

  def set_open {:name, name}, value do
    from(r in Room, where: r.name==^name, update: [set: [open: ^value]])
    |> Repo.update_all([])
  end

end