using System.Windows.Controls;
using System.Windows.Input;
using Beak.App.ViewModels;

namespace Beak.App.Controls.Welcome
{
	/// <summary>
	/// Interaction logic for WelcomeHome.xaml
	/// </summary>
	public partial class WelcomeHome : UserControl
	{
		public WelcomeHomeViewModel ViewModel { get { return DataContext as WelcomeHomeViewModel; } }

		public WelcomeHome()
		{
			InitializeComponent();

			DataContext = new WelcomeHomeViewModel(ApplicationService.Instance.EventAggregator);

			ViewModel.LoadMockData();
		}

		private void ButtonCreateNewLocalProject_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
		{
			if (!ViewModel.CreateNewLocalProjectCommand.CanExecute(null))
				return;

			ViewModel.CreateNewLocalProjectCommand.Execute(null);
		}

		private void ButtonOpenExistingProject_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
		{
			if (!ViewModel.OpenExistingProjectCommand.CanExecute(null))
				return;

			ViewModel.OpenExistingProjectCommand.Execute(null);
		}
	}
}
