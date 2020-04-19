defmodule BreadWeb.Chat do
  use Phoenix.Channel

  alias Bread.Rooms
  alias Bread.Chat
  alias Bread.Presence
  alias Bread.Accounts

  def join("chat:" <> room, _message, socket ) do
    room = Rooms.get_room({:name, room})
    if !!room and room.open and (room.unregistered_users_allowed || socket.assigns[:current_user]) do
      messages = Chat.get_messages({:room_id, room.id})
      |> Enum.map(fn m ->
        %{
          name: m.user.name,
          user_id: m.user_id,
          message: m.message,
          id: m.id
        }
      end)
      send(self(), :after_join)
      {:ok, %{messages: messages}, socket}
    else
      {:error, %{}}
    end
  end

  def handle_in("message:new", %{"message" => message}, socket) do
    "chat:" <> room = socket.topic
    room = Rooms.get_room({:name, room})
    if socket.assigns[:current_user] do
      case Chat.create_message(message, room.id, socket.assigns[:current_user].id) do
        {:ok, message} ->
          broadcast(socket, "message", %{"message" => message.message, "name" => socket.assigns[:current_user].name, "id" => message.id, "user_id" => message.user_id})
          {:noreply, socket}
        {:error, _} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("message:delete", %{"message_id" => id}, socket) do
    "chat:" <> room = socket.topic
    if socket.assigns[:current_user] do
      message = Chat.get_message({:id, id})
      room = Rooms.get_room({:id, message.room_id})
      if room && (room.user_id == socket.assigns[:current_user].id || message.user_id == socket.assigns[:current_user].id) do
        Chat.delete_message({:id, id})
        broadcast(socket, "message:delete", %{"message_id" => id})
        {:noreply, socket}
       end
    end
    {:noreply, socket}
  end


  def handle_in("user:kick", %{"user_id" => user_id}, socket) do
    "chat:" <> room = socket.topic
    if socket.assigns[:current_user] do
      room = Rooms.get_room({:name, room})
      if room && room.user_id == socket.assigns[:current_user].id do
        broadcast(socket, "user:kick", %{"user_id" => user_id})
       end
    end
    {:noreply, socket}
  end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))
    IO.inspect("Tracking user")
    if socket.assigns[:current_user] do
      {:ok, user} = Accounts.get_user({:id, socket.assigns[:current_user].id})
      {:ok, _} = Presence.track(socket, socket.assigns[:connection_id], %{
        online_at: inspect(System.system_time(:second)),
        user_id: socket.assigns[:current_user].id,
        name: socket.assigns[:current_user].name,
        connection_id: socket.assigns[:connection_id],
        avatar: user.profile_image
      })
    else
      {:ok, _} = Presence.track(socket, socket.assigns[:connection_id], %{
        online_at: inspect(System.system_time(:second)),
        connection_id: socket.assigns[:connection_id],
      })
    end
    {:noreply, socket}
  end

  def handle_in(_, _, socket) do
    {:noreply, socket}
  end

  def handle_info(_, _, socket) do
    {:noreply, socket}
  end
end