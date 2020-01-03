using System.Windows;
using System.Windows.Controls;

namespace Beak.UserInterface.Buttons
{
	/// <summary>
	/// Interaction logic for GettingStartedButton.xaml
	/// </summary>
	public partial class GettingStartedButton : UserControl
	{
		#region [ MainIcon property ]

		public static readonly DependencyProperty MainIconProperty = DependencyProperty.Register(
			"MainIcon",
			typeof(object),
			typeof(GettingStartedButton),
			new FrameworkPropertyMetadata(null)
		);

		public string MainIcon
		{
			get { return (string)GetValue(MainIconProperty); }
			set { SetValue(MainIconProperty, value); }
		}

		#endregion

		#region [ Title property ]

		public static readonly DependencyProperty TitleProperty = DependencyProperty.Register(
			"Title",
			typeof(object),
			typeof(GettingStartedButton),
			new FrameworkPropertyMetadata(null)
		);

		public string Title
		{
			get { return (string)GetValue(TitleProperty); }
			set { SetValue(TitleProperty, value); }
		}

		#endregion

		#region [ Description property ]

		public static readonly DependencyProperty DescriptionProperty = DependencyProperty.Register(
			"Description",
			typeof(object),
			typeof(GettingStartedButton),
			new FrameworkPropertyMetadata(null)
		);

		public string Description
		{
			get { return (string)GetValue(DescriptionProperty); }
			set { SetValue(DescriptionProperty, value); }
		}

		#endregion

		public GettingStartedButton()
		{
			InitializeComponent();

			DataContext = this;
		}
	}
}
