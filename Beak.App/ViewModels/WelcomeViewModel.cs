using Beak.App.Enums;
using Beak.App.Events;
using Beak.Common.Inpc;
using Prism.Events;

namespace Beak.App.ViewModels
{
	public sealed class WelcomeViewModel : BaseViewModel
	{
		private readonly IEventAggregator _eventAggregator;

		public WelcomeViewModel(IEventAggregator eventAggregator)
		{
			_eventAggregator = eventAggregator;

			_eventAggregator.GetEvent<WelcomeViewStateChangedEvent>().Subscribe(@event =>
			{
				ViewStage = @event;
			});
		}

		public WelcomeViewStage ViewStage
		{
			get { return _viewStage; }
			private set { SetField(ref _viewStage, value); }
		}
		private WelcomeViewStage _viewStage = WelcomeViewStage.Home;
	}
}
