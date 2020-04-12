defmodule Bread.Chat do
  import Ecto.Query, warn: false
  alias Bread.Repo

  alias Bread.Chat.ChatMessage
  def create_message message, room_id, user_id do
    %ChatMessage{}
    |> ChatMessage.changeset(%{
      message: message,
      room_id: room_id,
      user_id: user_id
    })
    |> Repo.insert()
  end

  def get_messages {:room_id, room_id}, limit \\ 100 do
    query = from c in ChatMessage, 
      where: c.room_id == ^room_id and c.deleted==false,
      order_by: c.inserted_at, 
      limit: ^limit,
      preload: [:user]

    Repo.all(query)
  end

  def get_message {:id, id}, preloads \\ [] do
    query = from m in ChatMessage, 
      where: m.id==^id,
      preload: ^preloads

    Repo.one(query)

  end

  def delete_message {:id, id} do
    from(m in ChatMessage, where: m.id==^id, update: [set: [deleted: true]])
    |> Repo.update_all([])
  end 

end