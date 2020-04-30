defmodule QwatchWeb.Coherence do
  @moduledoc false

  def view do
    quote do
      use Phoenix.View, root: "lib/qwatch_web/templates"
      # Import convenience functions from controllers

      import Phoenix.Controller, only: [get_csrf_token: 0, get_flash: 2, view_module: 1]

      # Use all HTML functionality (forms, tags, etc)
      use Phoenix.HTML

      import QwatchWeb.ErrorHelpers
      import QwatchWeb.Gettext
      import QwatchWeb.Coherence.ViewHelpers

      alias QwatchWeb.Router.Helpers, as: Routes
    end
  end

  def controller do
    quote do
      use Phoenix.Controller, except: [layout_view: 2]
      use Coherence.Config
      use Timex

      import Ecto
      import Ecto.Query
      import Plug.Conn
      import QwatchWeb.Gettext
      import Coherence.Controller

      alias Coherence.Config
      alias Coherence.Controller
      alias QwatchWeb.Router.Helpers, as: Routes

      require Redirects
    end
  end

  @doc """
  When used, dispatch to the appropriate controller/view/etc.
  """
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
