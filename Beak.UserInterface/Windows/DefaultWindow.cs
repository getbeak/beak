using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Interop;
using Beak.UserInterface.Native;

namespace Beak.UserInterface.Windows
{
	public partial class DefaultWindow : Window
	{
		public Border WindowBorder { get; private set; }

		public Button ButtonWindowMinimize { get; private set; }
		public Button ButtonWindowRestore { get; private set; }
		public Button ButtonWindowMaxamize { get; private set; }
		public Button ButtonWindowClose { get; private set; }

		public Thumb ResizeCorner { get; private set; }
		public Thumb ResizeRight { get; private set; }
		public Thumb ResizeBottom { get; private set; }

		public TextBlock Testing { get; private set; }

		#region [ TitleIcon property ]

		public static readonly DependencyProperty TitleIconProperty = DependencyProperty.Register(
			"TitleIcon",
			typeof(object),
			typeof(DefaultWindow),
			new FrameworkPropertyMetadata(null)
		);

		public Grid TitleIcon
		{
			get { return (Grid)GetValue(TitleIconProperty); }
			set { SetValue(TitleIconProperty, value); }
		}

		#endregion

		#region [ TitleMenu property ]

		public static readonly DependencyProperty TitleMenuProperty = DependencyProperty.Register(
			"TitleMenu",
			typeof(object),
			typeof(DefaultWindow),
			new FrameworkPropertyMetadata(null)
		);

		public Menu TitleMenu
		{
			get { return (Menu)GetValue(TitleMenuProperty); }
			set { SetValue(TitleMenuProperty, value); }
		}

		#endregion

		static DefaultWindow()
		{
			DefaultStyleKeyProperty.OverrideMetadata(
				typeof(DefaultWindow),
				new FrameworkPropertyMetadata(typeof(DefaultWindow))
			);
		}

		public DefaultWindow()
		{
			WindowStartupLocation = WindowStartupLocation.CenterScreen;

			DwmDropShadow.DropShadowToWindow(this);

			StateChanged += DefaultWindow_StateChanged;
		}

		internal T GetRequiredTemplateChild<T>(string childName) where T : DependencyObject
		{
			return (T)GetTemplateChild(childName);
		}

		public override void OnApplyTemplate()
		{
			WindowBorder = GetRequiredTemplateChild<Border>("WindowBorder");

			ButtonWindowMinimize = GetRequiredTemplateChild<Button>("ButtonWindowMinimize");
			ButtonWindowRestore = GetRequiredTemplateChild<Button>("ButtonWindowRestore");
			ButtonWindowMaxamize = GetRequiredTemplateChild<Button>("ButtonWindowMaxamize");
			ButtonWindowClose = GetRequiredTemplateChild<Button>("ButtonWindowClose");

			ResizeCorner = GetRequiredTemplateChild<Thumb>("ResizeCorner");
			ResizeRight = GetRequiredTemplateChild<Thumb>("ResizeRight");
			ResizeBottom = GetRequiredTemplateChild<Thumb>("ResizeBottom");

			Testing = GetRequiredTemplateChild<TextBlock>("TextBlockTitle");

			ButtonWindowMinimize.Click += ButtonWindowMinimize_Click;
			ButtonWindowRestore.Click += ButtonWindowRestore_Click;
			ButtonWindowMaxamize.Click += ButtonWindowMaxamize_Click;
			ButtonWindowClose.Click += ButtonWindowClose_Click;

			ResizeCorner.DragDelta += ResizeCorner_DragDelta;
			ResizeRight.DragDelta += ResizeRight_DragDelta;
			ResizeBottom.DragDelta += ResizeBottom_DragDelta;

			Testing.MouseDown += Testing_MouseDown;
			Testing.PreviewMouseDown += Testing_MouseDown;

			base.OnApplyTemplate();

			// Initial fire of this to setup window action buttons and resize tings
			DefaultWindow_StateChanged(null, null);
		}

		private void Testing_MouseDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
		{
			DragMove();
		}

		protected override void OnSourceInitialized(EventArgs e)
		{
			base.OnSourceInitialized(e);

			var handle = (new WindowInteropHelper(this)).Handle;
			var hwndSource = HwndSource.FromHwnd(handle);

			if (hwndSource != null)
				hwndSource.AddHook(WindowProc);
		}

		#region [ Resizing management ]

		private void ResizeCorner_DragDelta(object sender, DragDeltaEventArgs e)
		{
			var yadjust = Height + e.VerticalChange;
			var xadjust = Width + e.HorizontalChange;

			if (xadjust > MinWidth) Width = xadjust;
			if (yadjust > MinHeight) Height = yadjust;
		}

		private void ResizeRight_DragDelta(object sender, DragDeltaEventArgs e)
		{
			var xadjust = Width + e.HorizontalChange;

			if (xadjust > MinWidth) Width = xadjust;
		}

		private void ResizeBottom_DragDelta(object sender, DragDeltaEventArgs e)
		{
			var yadjust = Height + e.VerticalChange;

			if (yadjust > MinHeight) Height = yadjust;
		}

		#endregion

		#region [ Window state management ]

		private void DefaultWindow_StateChanged(object sender, EventArgs e)
		{
			switch (WindowState)
			{
				case WindowState.Normal:
					WindowBorder.BorderThickness = new Thickness(1, 1, 1, 23);
					ButtonWindowRestore.Visibility = Visibility.Collapsed;
					ButtonWindowMaxamize.Visibility = Visibility.Visible;
					ResizeCorner.Visibility = Visibility.Visible;
					ResizeRight.Visibility = Visibility.Visible;
					ResizeBottom.Visibility = Visibility.Visible;
					break;

				case WindowState.Maximized:
					WindowBorder.BorderThickness = new Thickness(0, 0, 0, 23);
					ButtonWindowRestore.Visibility = Visibility.Visible;
					ButtonWindowMaxamize.Visibility = Visibility.Collapsed;
					ResizeCorner.Visibility = Visibility.Collapsed;
					ResizeRight.Visibility = Visibility.Collapsed;
					ResizeBottom.Visibility = Visibility.Collapsed;
					break;
			}
		}

		private void ButtonWindowMinimize_Click(object sender, RoutedEventArgs e)
		{
			WindowState = WindowState.Minimized;
		}

		private void ButtonWindowRestore_Click(object sender, RoutedEventArgs e)
		{
			WindowState = WindowState.Normal;
		}

		private void ButtonWindowMaxamize_Click(object sender, RoutedEventArgs e)
		{
			WindowState = WindowState.Maximized;
		}

		private void ButtonWindowClose_Click(object sender, RoutedEventArgs e)
		{
			Close();
		}

		#endregion

		#region [ Maximize workspace workarounds ]

		private IntPtr WindowProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
		{
			switch (msg)
			{
				case 0x0024:
					WmGetMinMaxInfo(hwnd, lParam);
					handled = true;
					break;
			}
			return IntPtr.Zero;
		}

		private static void WmGetMinMaxInfo(IntPtr hwnd, IntPtr lParam)
		{
			var mmi = (MonitorWorkarea.MINMAXINFO)Marshal.PtrToStructure(lParam, typeof(MonitorWorkarea.MINMAXINFO));

			// Adjust the maximized size and position to fit the work area of the correct monitor
			const int monitorDefaulttonearest = 0x00000002;
			IntPtr monitor = MonitorWorkarea.MonitorFromWindow(hwnd, monitorDefaulttonearest);

			if (monitor != IntPtr.Zero)
			{
				var monitorInfo = new MonitorWorkarea.MONITORINFO();
				MonitorWorkarea.GetMonitorInfo(monitor, monitorInfo);
				MonitorWorkarea.RECT rcWorkArea = monitorInfo.rcWork;
				MonitorWorkarea.RECT rcMonitorArea = monitorInfo.rcMonitor;
				mmi.ptMaxPosition.x = Math.Abs(rcWorkArea.left - rcMonitorArea.left);
				mmi.ptMaxPosition.y = Math.Abs(rcWorkArea.top - rcMonitorArea.top);
				mmi.ptMaxSize.x = Math.Abs(rcWorkArea.right - rcWorkArea.left);
				mmi.ptMaxSize.y = Math.Abs(rcWorkArea.bottom - rcWorkArea.top);
			}

			Marshal.StructureToPtr(mmi, lParam, true);
		}

		#endregion
	}
}
