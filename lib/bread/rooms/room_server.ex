defmodule Bread.Rooms.RoomServer do
  use GenServer

  alias Bread.Rooms
  alias Bread.Rooms.RoomSupervisor

  # API

  def start_link(name) do
    # Instead of passing an atom to the `name` option, we send 
    # a tuple. Here we extract this tuple to a private method
    # called `via_tuple` that can be reused for every function
    GenServer.start_link(__MODULE__, name, name: via_tuple(name))
  end

  def update_room(room_name) do
    GenServer.cast(via_tuple(room_name), {:update_room})
  end

  def update_link(room_name, link_id) do
    GenServer.cast(via_tuple(room_name), {:update_link, link_id})
  end

  def enqueue_link(room_name, link, position, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:enqueue_link, %{link: link, position: position}, user_id, connection_id})
  end

  def update_queue(room_name, queue, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:update_queue, queue, user_id, connection_id})
  end

  def next(room_name, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:next, user_id, connection_id})
  end

  def select(room_name, link_id, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:select, link_id, user_id, connection_id})
  end

  def update_position(room_name, position, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:update_position, position, user_id, connection_id})
  end

  def request_remote(room_name, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:request_remote, user_id, connection_id})
  end

  def drop_remote(room_name, user_id, connection_id) do
    GenServer.call(via_tuple(room_name), {:drop_remote, user_id, connection_id})
  end

  def set_open(room_name, user_id, value) do
    GenServer.call(via_tuple(room_name), {:set_open, user_id, value})
  end

  def get_state(room_name) do
    GenServer.call(via_tuple(room_name), :get_state)
  end

  defp via_tuple(room_name) do
    # And the tuple always follow the same format:
    # {:via, module_name, term}
    {:via, Registry, {Registry.RoomRegistry, room_name}}
    # {:via, Registry.RoomRegistry, {:room, room_name}}
  end


  # Server

  def init(room_name) do
    room = Rooms.get_room({:name, room_name}, %{preload: [:links]})
    if room do
      queue = deserialize_queue(room.queue)
      links = Rooms.get_links({:list, queue}) 
      |> Map.new(fn link -> 
        {link.id, 
        link_to_map(link)
        } 
      end)
      
      state = %{
        room_name: room.name,
        title: room.title,
        description: room.description,
        room_id: room.id,
        links: links,
        link_queue: queue,
        link_suggestions: [],
        server_playing: room.server_playing,
        position: %{
          seconds: room.position_seconds || 0, 
          duration: room.position_duration || 0, 
          playing: !!room.position_playing, 
          at: room.position_at || DateTime.utc_now(),
          link_id: (if room.position_duration, do: room.current_link_id, else: nil),
          index: room.position_index
          },
        remote_available: false,
        remote_holder_user_id: room.remote_holder_id || room.user_id,
        remote_holder_connection_id: room.remote_holder_connection_id,
        owner_id: room.user_id,
        open: room.open,
        unregistered_users_allowed: room.unregistered_users_allowed
      }
      {:ok, state}
    else
      {:stop, "Room does not exist"}
    end
  end

  def handle_cast({:update_room}, state) do
    room = Rooms.get_room({:name, state.room_name})
    if room do
      state = state
        |> Map.put(:title, room.title)
        |> Map.put(:description, room.description)
        |> Map.put(:unregistered_users_allowed, room.unregistered_users_allowed)
        |> Map.put(:open, room.open)
      {:noreply, state}
    else
      {:noreply, state}
    end
  end

  def handle_cast({:update_link, link_id}, state) do
    IO.inspect("[RS-" <> state[:room_name] <> "] Updating link")
    link = Rooms.get_link({:id, link_id})
    if link do
      link_map = link_to_map(link)
      state = Map.update!(state, :links, fn links -> Map.put(links, link.id, link_map) end)
      BreadWeb.Endpoint.broadcast("room:" <> state[:room_name], "link:info", %{link: link_map})
      {:noreply, state}
    else
      {:noreply, state}
    end
  end

  def handle_call({:enqueue_link, %{link: link, position: position}, user_id, connection_id}, _from, state) do
    if connection_id == state[:remote_holder_connection_id] do
      case Rooms.create_link(%{link: link, room_id: state[:room_id], user_id: user_id}) do
        {:ok, link} -> 
          state = Map.update!(state, :links, fn links -> Map.put(links, link.id, %{link: link.link, id: link.id}) end)
          state = case position do
            :play -> 
              state
              |> Map.update!(:link_queue, fn queue -> List.insert_at(queue, state.server_playing, link.id) end)
              |> Map.update!(:position, fn _ -> %{seconds: 0, duration: 0, playing: true, at: DateTime.utc_now(), link_id: link.id} end)
            :front ->
              Map.update!(state, :link_queue, fn queue -> List.insert_at(queue, state.server_playing+1, link.id) end)
            :end -> 
              Map.update!(state, :link_queue, fn queue -> List.insert_at(queue, -1, link.id) end)
          end
          state = if length(state[:link_queue]) > 30 do
            Map.update!(state, :link_queue, fn queue -> List.delete_at(queue, 0) end)
          else
            state
          end
          persist_state(state, %{queue: true})
          Task.async(fn -> Rooms.get_link_info(link.id) end)
          {:reply, {:accepted, state, %{link.id => %{link: link.link, id: link.id}}}, state}
        {:error, _} -> {:reply, state, state}
      end
    else
      {:reply, {:rejected, state}, state}
    end
  end

  def handle_call({:update_queue, queue, user_id, connection_id}, _from, state) do
    if connection_id == state[:remote_holder_connection_id] do
      prev_queue = state[:link_queue]

      queue = Enum.filter(queue, fn l -> !!state[:links][l] end)
      state = Map.update!(state, :link_queue, fn _ -> queue end)

      state = if state[:server_playing] do
          playing_id = Enum.at(prev_queue, state[:server_playing])
          new_playing_index = Enum.find_index(state[:link_queue], fn l -> l == playing_id end)
          if new_playing_index do
            state
              |> Map.update!(:server_playing, fn _ -> new_playing_index end)
              |> Map.update!(:position, fn _ -> %{seconds: 0, duration: 0, playing: true, at: DateTime.utc_now(), link_id: playing_id} end)
          else
            state
              |> Map.update!(:server_playing, fn _ -> nil end)
              |> Map.update!(:position, fn _ -> %{seconds: 0, duration: 0, playing: true, at: DateTime.utc_now(), link_id: nil} end)
          end
        else
          state
      end

      persist_state(state, %{queue: true})

      {:reply, {:accepted, state}, state}
    else
      {:reply, {:rejected, state}, state}
    end
  end

  def handle_call({:next, user_id, connection_id}, _from, state) do
    if connection_id == state[:remote_holder_connection_id] && !!state[:server_playing] do
      if state[:server_playing] < length(state.link_queue)-1 do
        playing_id = Enum.at(state[:link_queue], state[:server_playing])
        state = state
        |> Map.update!(:server_playing, fn old -> old+1 end)
        |> Map.update!(:position, fn _ -> %{seconds: 0, duration: 0, playing: true, at: DateTime.utc_now(), link_id: playing_id} end)
        persist_state(state, %{queue: false})
        {:reply, {:accepted, state}, state}
      else
        {:reply, {:rejected, state}, state}
      end
    else
      {:reply, {:rejected, state}, state}
    end

  end

  def handle_call({:select, link_id, user_id, connection_id}, _from, state) do
    if connection_id == state[:remote_holder_connection_id] do
      index = Enum.find_index(state.link_queue, fn id -> id == link_id end)
      if index do
        state = state
        |> Map.update!(:server_playing, fn _ -> index end)
        |> Map.update!(:position, fn _ -> %{seconds: 0, duration: 0, playing: true, at: DateTime.utc_now(), link_id: link_id} end)
        persist_state(state, %{queue: false})
        {:reply, {:accepted, state}, state}
      else
        {:reply, {:rejected, state}, state}
      end
    else
      {:reply, {:rejected, state}, state}
    end
  end

  defp next(state) do
    case state[:link_queue] do
      [] -> state
      [head | tail] -> 
        state
        |> Map.update!(:link_queue, fn queue -> tail end)
        |> Map.update!(:server_playing, fn _ -> head end)
    end
  end

  defp persist_state(state, params \\ %{}) do
    update = %{
      position_seconds: state[:position][:seconds],
      position_duration: state[:position][:duration],
      position_playing: state[:position][:playing],
      position_at: state[:position][:at],
      position_index: state[:position][:index],
      remote_holder_id: state[:remote_holder_user_id],
      remote_holder_connection_id: state[:remote_holder_connection_id],
      server_playing: state[:server_playing], 
      current_link_id: (if state[:server_playing], do: Enum.at(state[:link_queue], state[:server_playing]), else: nil)
    }
    update = if params[:queue] do
      Map.put(update, :queue, Enum.reduce(state[:link_queue], "", fn l, acc -> acc <> inspect(l) <> "," end))
    else
      update
    end

    Rooms.update_room(
      state[:room_name], 
      update
    )
  end

  defp deserialize_queue(queue_string) do
    if queue_string do 
      queue = queue_string
      |> String.split(",")
      |> Enum.slice(0..-2)
      |> Enum.map(fn s ->
        {id, _} = Integer.parse(s)
        id
      end)
    else
      []
    end
  end

  def handle_call({:update_position, position, user_id, connection_id}, _from, state) do
    IO.inspect(position)
    if !!state[:server_playing] && connection_id == state[:remote_holder_connection_id] do
      new_position = %{
        seconds: position[:seconds],
        duration: position[:duration],
        playing: position[:playing],
        index: position[:index],
        at: DateTime.utc_now(),
        link_id: Enum.at(state[:link_queue], state[:server_playing])
      }
      state = Map.update!(state, :position, fn _ -> new_position end)

      persist_state(state)
      {:reply, {:accepted, state}, state}
    else
      {:reply, {:rejected, state}, state}
    end
  end
    
  def handle_call({:request_remote, user_id, connection_id}, _from, state) do
    if user_id == state[:owner_id] or user_id == state[:remote_holder_user_id] or state[:remote_available] do
      state = state
      |> Map.update!(:remote_holder_user_id, fn _ -> user_id end)
      |> Map.update!(:remote_holder_connection_id, fn _ -> connection_id end)
      |> Map.update!(:remote_available, fn _ -> false end)

      persist_state(state)
      {:reply, {:accepted, state}, state}
    else
      {:reply, {:rejected, state}, state}
    end
  end

  def handle_call({:drop_remote, user_id, connection_id}, _from, state) do
    if user_id == state[:remote_holder_user_id] and connection_id == state[:remote_holder_connection_id] do
      state = state
      |> Map.update!(:remote_available, fn _ -> true end)
      |> Map.update!(:remote_holder_connection_id, fn _ -> nil end)

      persist_state(state)

      {:reply, {:accepted, state}, state}
    else
      {:reply, {:rejected, state}, state}
    end
  end

  def handle_call({:set_open, user_id, value}, _from, state) do
    if user_id == state[:owner_id] do
      Rooms.set_open({:name, state.room_name}, value)

      state = state
      |> Map.update!(:open, fn _ -> value end)

      {:reply, {:accepted, state}, state}
    else
      {:reply, {:rejected, state}, state}
    end
  end

  def handle_call(:get_state, _from, state) do
    {:reply, state, state}
  end

  defp link_to_map link do
    %{
      id: link.id,
      link: link.link,
      title: link.title,
      description: link.description,
      site_name: link.site_name,
      image: link.external_image
    }
  end

end