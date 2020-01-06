using System.Windows.Input;
using Beak.App.Enums;
using Beak.App.Events;
using Beak.Common.Inpc;
using Prism.Events;

namespace Beak.App.ViewModels
{
	public sealed class WelcomeNewLocalProjectViewModel : BaseViewModel
	{
		private readonly IEventAggregator _eventAggregator;

		public WelcomeNewLocalProjectViewModel(IEventAggregator eventAggregator)
		{
			_eventAggregator = eventAggregator;

			GoBackToHomeCommand = new RelayCommand(GoBackToHome);
		}

		public ICommand GoBackToHomeCommand
		{
			get { return _goBackToHomeCommand; }
			private set { SetField(ref _goBackToHomeCommand, value); }
		}
		private ICommand _goBackToHomeCommand;

		private void GoBackToHome()
		{
			_eventAggregator.GetEvent<WelcomeViewStateChangedEvent>().Publish(WelcomeViewStage.Home);
		}
	}
}
