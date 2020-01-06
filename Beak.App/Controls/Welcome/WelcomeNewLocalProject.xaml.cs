using System.Windows.Controls;
using Beak.App.ViewModels;

namespace Beak.App.Controls.Welcome
{
	/// <summary>
	/// Interaction logic for WelcomeNewLocalProject.xaml
	/// </summary>
	public partial class WelcomeNewLocalProject : UserControl
	{
		public WelcomeNewLocalProject()
		{
			InitializeComponent();

			DataContext = new WelcomeNewLocalProjectViewModel(ApplicationService.Instance.EventAggregator);
		}
	}
}
