defmodule BreadWeb.Room do
  use Phoenix.Channel

  alias Bread.Rooms.RoomSupervisor
  alias Bread.Rooms.RoomServer

  def join("room:" <> room, _message, socket ) do
    case RoomSupervisor.start_room(room) do
      {:error, reason} -> 
        IO.inspect(reason)
        {:error, %{reason: "There was an error connecting to the server"}}
      {:ok, _} ->
        state = RoomServer.get_state(room)
          state_resp = %{
            links: state[:links],
            link_queue: state[:link_queue],
            server_playing: state[:server_playing],
            server_position: calculate_position(state[:position]),
            remote_available: state[:remote_available],
            remote_holder_user_id: state[:remote_holder_user_id],
            remote_holder_connection_id: state[:remote_holder_connection_id],
            owner_id: state[:owner_id],
            unregistered_users_allowed: state[:unregistered_users_allowed]
          }
        cond do
          (!state.unregistered_users_allowed and !socket.assigns[:current_user]) ->
            {:error, %{reason: "The room does not allow unregistered users"}}
          state.open -> 
            {:ok, %{state: state_resp, connection_id: socket.assigns[:connection_id]}, socket}
          (socket.assigns[:current_user] && socket.assigns[:current_user].id == state.owner_id) -> 
            RoomServer.set_open(room, socket.assigns[:current_user].id, true)
            {:ok, %{state: state_resp, connection_id: socket.assigns[:connection_id]}, socket}
          true -> 
            {:error, %{reason: "The room is closed"}}
        end
    end

  end

  def handle_in("link:enqueue", %{"link" => link}, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case RoomServer.enqueue_link(room, link, :end, socket.assigns[:current_user].id, socket.assigns[:connection_id]) do
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

  def handle_in("room:close", _, socket) do
    "room:" <> room = socket.topic
    if socket.assigns[:current_user] do
      case  RoomServer.set_open(room, socket.assigns[:current_user].id, false) do
        {:accepted, state} ->
          broadcast(socket, "room:close", %{})
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