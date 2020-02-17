using System;
using System.Collections.Generic;
using System.Globalization;
using System.Windows.Data;

namespace Beak.App.Converters
{
	public class DictionaryKeyConverter : IValueConverter
	{
		public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
		{
			var dict = (Dictionary<string, string>)value;

			return dict.Keys;
		}
		public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
		{
			return null;
		}
	}
}
