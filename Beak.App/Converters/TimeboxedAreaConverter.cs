using System;
using System.Globalization;
using System.Windows.Data;
using Beak.App.Enums;

namespace Beak.App.Converters
{
	public class TimeboxedAreaConverter : IValueConverter
	{
		public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
		{
			switch((TimeboxedArea)value)
			{
				case TimeboxedArea.Today:
					return "Today";
				case TimeboxedArea.ThisWeek:
					return "This week";
				case TimeboxedArea.ThisMonth:
					return "This month";
				case TimeboxedArea.Older:
					return "Older";

				default:
					return "Unknown period of time???";
			}
		}
		public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
		{
			return null;
		}
	}
}
