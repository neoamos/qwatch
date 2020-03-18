defmodule BreadWeb.Room do
  use Phoenix.Channel

  alias Bread.Rooms.RoomSupervisor
  alias Bread.Rooms.RoomServer

  def join("room:" <> room, _message, socket ) do
    case RoomSupervisor.start_room(room) do
      {:error, reason} -> 
        IO.inspect(reason)
        {:error, %{reason: "Error starting room server"}}
      {:ok, _} ->
        state = RoomServer.get_state(room)
        state = %{
          links: state[:links],
          link_queue: state[:link_queue],
          server_playing: state[:server_playing],
          server_position: calculate_position(state[:position]),
          remote_available: state[:remote_available],
          remote_holder_user_id: state[:remote_holder_user_id],
          remote_holder_connection_id: state[:remote_holder_connection_id],
          owner_id: state[:owner_id]
        }
        {:ok, %{state: state, connection_id: socket.assigns[:connection_id]}, socket}
    end

  end

  def handle_in("link:enqueue", %{"link" => link}, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.enqueue_link(room, link, :front, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state, link} -> 
          state = %{
            links: link,
            link_queue: state[:link_queue],
            server_playing: state[:server_playing]
          }
    
          broadcast(socket, "state:update", %{state: state})
          {:noreply, socket}
        {:rejected, _} -> 
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("link:next", _, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.next(room, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state} -> 
          state = %{
            link_queue: state[:link_queue],
            server_playing: state[:server_playing]
          }
    
          broadcast(socket, "state:update", %{state: state})
    
          {:noreply, socket}
        _ -> {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("link:select", %{"link_id" => id}, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.select(room, id, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state}->
          state = %{
            server_playing: state[:server_playing]
          }

          broadcast(socket, "state:update", %{state: state})

          {:noreply, socket}
        _ -> {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("queue:update", %{"queue" => queue}, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.update_queue(room, queue, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state} ->
          state = %{
            server_playing: state[:server_playing],
            link_queue: state[:link_queue]
          }
          broadcast(socket, "state:update", %{state: state})
          {:noreply, socket}
        _ -> {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("remote:request", _, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.request_remote(room, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state} ->
          state = %{
            remote_available: state[:remote_available],
            remote_holder_user_id: state[:remote_holder_user_id],
            remote_holder_connection_id: state[:remote_holder_connection_id]
          }
          broadcast(socket, "state:update", %{state: state})
          {:noreply, socket}
        {:rejected, state} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("position:update", %{"position" => position}, socket) do
    "room:" <> room = socket.topic
    position = %{
      seconds: position["seconds"],
      duration: position["duration"],
      playing: position["playing"]
    }
    if socket.assigns[:current_user] do
      case RoomServer.update_position(room, position, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state} ->
          state = %{
            server_position: calculate_position(state[:position])
          }
          broadcast(socket, "state:update", %{state: state})
          {:noreply, socket}
        {:rejected, state} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_in("remote:drop", _, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.drop_remote(room, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
        {:accepted, state} ->
          state = %{
            remote_available: state[:remote_available],
            remote_holder_user_id: state[:remote_holder_user_id],
            remote_holder_connection_id: state[:remote_holder_connection_id] || "empty"
          }
          broadcast(socket, "state:update", %{state: state})
          {:noreply, socket}
        {:rejected, state} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  defp calculate_position position do
    %{
      seconds: (if position[:playing], do: position[:seconds] + abs(DateTime.diff(position[:at], DateTime.utc_now())), else: position[:seconds]),
      duration: position[:duration],
      playing: position[:playing],
      link_id: position[:link_id]
    }
  end

  # def handle_in("message:new", %{"message" => message}, socket) do
  #   "room:" <> room = socket.topic
  #   {:noreply, socket}
  # end

end