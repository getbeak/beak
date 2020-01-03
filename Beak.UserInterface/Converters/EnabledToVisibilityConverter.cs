using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace Beak.UserInterface.Converters
{
	public class EnabledToVisibilityConverter : IValueConverter
	{
		public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
		{
			var boolyValue = value as Nullable<bool>;

			// Hide the ting if the vlaue is null or true
			if (boolyValue == null || boolyValue == true)
				return Visibility.Hidden;

			return Visibility.Visible;
		}
		public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
		{
			return null;
		}
	}
}
