defmodule Bread.Rooms do
  import Ecto.Query, warn: false
  alias Bread.Repo

  alias Bread.Rooms.Room
  alias Bread.Rooms.Link
  alias Bread.LinkFetcher
  alias Bread.Rooms.RoomServer

  def create_room attrs do
    %Room{}
    |> Room.changeset(attrs)
    |> Repo.insert()
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

  def update_link link_id, attrs do
    link = get_link({:id, link_id})
    if link do
      link
      |> Link.edit_changeset(attrs)
      |> Repo.update()
    else
      {:error, "Link does not exist"}
    end
  end

  def get_room {:name, name}, params \\ %{} do
    query = from r in Room, where: r.name==^name

    query = if params[:preload] do
      from r in query, preload: ^params[:preload]
    else
      query
    end

    Repo.one(query)
  end

  def get_rooms params \\ %{} do
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

    Repo.all(query)
  end

  def get_link {:id, id}, params \\ %{} do
    query = from l in Link, where: l.id==^id

    query = if params[:preload] do
      from l in query, preload: ^params[:preload]
    else
      query
    end

    Repo.one(query)
  end

  def get_links {:list, id_list}, params \\ %{} do
    query = from l in Link, where: l.id in ^id_list

    query = if params[:preload] do
      from l in query, preload: ^params[:preload]
    else
      query
    end

    Repo.all(query)
  end

  def get_link_info link_id do
    link = get_link({:id, link_id}, preload: [:room])
    IO.inspect(link)
    if link do
      case LinkFetcher.fetch(link.link) do
        {:ok, info} -> 
          update = %{
            title: info.title,
            description: info.description,
            site_name: info.site_name,
            external_image: info.image
          }
          case update_link link_id, update do
            {:ok, new_link} ->
              RoomServer.update_link(link.room.name, link.id)
              {:ok, new_link}
            other -> other
          end
        {:error, message} -> 
          IO.puts("Failed to fetch link information")
          IO.inspect(message)
          {:error, message}
        other -> {:error, ""}
      end
    else
      {:error, "Link does not exist"}
    end
  end
end