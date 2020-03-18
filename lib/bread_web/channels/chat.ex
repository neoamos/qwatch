defmodule BreadWeb.Chat do
  use Phoenix.Channel

  alias Bread.Rooms
  alias Bread.Chat
  alias Bread.Presence

  def join("chat:" <> room, _message, socket ) do
    room = Rooms.get_room({:name, room})
    if room do
      messages = Chat.get_messages({:room_id, room.id})
      |> Enum.map(fn m ->
        %{
          name: m.user.name,
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
          broadcast(socket, "message", %{"message" => message.message, "name" => socket.assigns[:current_user].name, "id" => message.id})
          {:noreply, socket}
        {:error, _} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  # def handle_in("message:delete", %{"message_id" => id}, socket) do
  #   message = Chat.get_message({:id, id})
  #   if Bread.Accounts.Roles.authorized?(socket.assigns[:current_user], :delete_chat) || message.user_id == socket.assigns[:current_user].id do
  #     Chat.delete_message({:id, id}, socket.assigns[:current_user].id)
  #     broadcast(socket, "message:delete", %{"message_id" => id})
  #     {:noreply, socket}
  #   end
  # end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))
    IO.inspect("Tracking user")
    if socket.assigns[:current_user] do
      {:ok, _} = Presence.track(socket, socket.assigns[:connection_id], %{
        online_at: inspect(System.system_time(:second)),
        user_id: socket.assigns[:current_user].id,
        name: socket.assigns[:current_user].name,
        connection_id: socket.assigns[:connection_id]
      })
    else
      {:ok, _} = Presence.track(socket, socket.assigns[:connection_id], %{
        online_at: inspect(System.system_time(:second)),
      })
    end
    {:noreply, socket}
  end
end