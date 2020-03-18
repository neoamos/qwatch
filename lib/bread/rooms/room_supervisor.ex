
defmodule Bread.Rooms.RoomSupervisor do
  use Supervisor

  def start_link _ do
    # We are now registering our supervisor process with a name
    # so we can reference it in the `start_room/1` function
    Supervisor.start_link(__MODULE__, [], name: :room_supervisor)
  end

  def start_room(name) do
    case Supervisor.start_child(:room_supervisor, [name]) do
      {:error, {:already_started, pid}} -> {:ok, pid}
      other -> other
    end
  end

  def init(_) do
    children = [
      worker(Bread.Rooms.RoomServer, [])
    ]

    # We also changed the `strategy` to `simple_one_for_one`.
    # With this strategy, we define just a "template" for a child,
    # no process is started during the Supervisor initialization, just
    # when we call `start_child/2`
    supervise(children, strategy: :simple_one_for_one)
  end
end

